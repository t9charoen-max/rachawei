-- =============================================================================
-- Rachawei-store — 010 stock restore, duplicate guard, admin slip/status ops
-- Requires 009 (or prior store_create_order). Safe additive migration.
-- =============================================================================

alter table public.store_orders
  add column if not exists stock_restocked boolean not null default false;

-- Restore product stock from order line items (once per order unless force)
create or replace function public.store_restore_order_stock(
  p_order_id text,
  p_force boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.store_orders%rowtype;
  v_row record;
begin
  select * into v_order
  from public.store_orders
  where id = trim(p_order_id)
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.stock_restocked and not coalesce(p_force, false) then
    return false;
  end if;

  for v_row in
    select product_id, qty
    from public.store_order_items
    where order_id = v_order.id
      and product_id is not null
  loop
    update public.store_products
       set stock = stock + greatest(0, v_row.qty),
           updated_at = now()
     where id = v_row.product_id
       and stock is not null;
  end loop;

  update public.store_orders
     set stock_restocked = true,
         updated_at = now()
   where id = v_order.id;

  return true;
end;
$$;

revoke all on function public.store_restore_order_stock(text, boolean) from public;
grant execute on function public.store_restore_order_stock(text, boolean) to authenticated;

-- Admin delete: restore stock then delete (007 behaviour + stock)
create or replace function public.store_admin_delete_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text := nullif(trim(coalesce(p_order_id, '')), '');
  v_deleted_items integer := 0;
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;

  if v_order_id is null then
    raise exception 'missing_order_id';
  end if;

  if not exists (select 1 from public.store_orders o where o.id = v_order_id) then
    raise exception 'order_not_found';
  end if;

  perform public.store_restore_order_stock(v_order_id, false);

  delete from public.store_order_items where order_id = v_order_id;
  get diagnostics v_deleted_items = row_count;

  delete from public.store_orders where id = v_order_id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'deleted_items', v_deleted_items
  );
end;
$$;

revoke all on function public.store_admin_delete_order(text) from public;
grant execute on function public.store_admin_delete_order(text) to authenticated;

-- Reject uploaded slip (admin) — keeps order, clears slip, status back to pending review
create or replace function public.store_admin_reject_payment_slip(p_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text := nullif(trim(coalesce(p_order_id, '')), '');
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;
  if v_order_id is null then
    raise exception 'missing_order_id';
  end if;

  update public.store_orders
     set payment_slip = null,
         slip_uploaded_at = null,
         status_index = 0,
         updated_at = now()
   where id = v_order_id;

  if not found then
    raise exception 'order_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.store_admin_reject_payment_slip(text) from public;
grant execute on function public.store_admin_reject_payment_slip(text) to authenticated;

-- Admin set status; status_index 5 = cancelled → restore stock once
create or replace function public.store_admin_set_order_status(
  p_order_id text,
  p_status_index integer,
  p_history jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text := nullif(trim(coalesce(p_order_id, '')), '');
  v_idx integer := greatest(0, coalesce(p_status_index, 0));
  v_hist jsonb := coalesce(p_history, '[]'::jsonb);
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;
  if v_order_id is null then
    raise exception 'missing_order_id';
  end if;
  if jsonb_typeof(v_hist) <> 'array' then
    raise exception 'invalid_history';
  end if;

  if not exists (select 1 from public.store_orders where id = v_order_id) then
    raise exception 'order_not_found';
  end if;

  if v_idx = 5 then
    perform public.store_restore_order_stock(v_order_id, false);
  end if;

  update public.store_orders
     set status_index = v_idx,
         history = v_hist,
         updated_at = now()
   where id = v_order_id;

  return true;
end;
$$;

revoke all on function public.store_admin_set_order_status(text, integer, jsonb) from public;
grant execute on function public.store_admin_set_order_status(text, integer, jsonb) to authenticated;

-- Patch store_create_order: duplicate guard (same phone + total within 120s)
-- Re-run full body from 009 with extra guard at start after validation
create or replace function public.store_create_order(
  p_customer_name text,
  p_customer_phone text,
  p_phone_display text,
  p_customer_address text,
  p_note text,
  p_method text,
  p_subtotal numeric,
  p_promo_discount numeric,
  p_shipping_fee numeric,
  p_total numeric,
  p_payment_slip text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_seq integer;
  v_day text := to_char(timezone('Asia/Bangkok', now()), 'YYYYMMDD');
  v_method text := coalesce(nullif(trim(p_method), ''), 'transfer');
  v_item jsonb;
  v_qty integer;
  v_product_id text;
  v_now timestamptz := now();
  v_settings public.store_shop_settings%rowtype;
  v_product public.store_products%rowtype;
  v_subtotal numeric(12, 2) := 0;
  v_promo numeric(12, 2) := 0;
  v_shipping numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_line_total numeric(12, 2);
  v_lines jsonb := '[]'::jsonb;
  v_phone_norm text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  v_dup_id text;
  v_items_sig text;
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'customer_name_required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items_required';
  end if;

  if v_method not in ('transfer', 'cod', 'promptpay', 'other') then
    v_method := 'transfer';
  end if;

  select * into v_settings
  from public.store_shop_settings
  where id = 'default'
  for update;

  if not found then
    insert into public.store_shop_settings (id, order_seq)
    values ('default', 1)
    returning * into v_settings;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(trim(v_item->>'id'), '');
    if v_product_id is null then
      raise exception 'product_id_required';
    end if;

    v_qty := greatest(1, floor(coalesce((v_item->>'qty')::numeric, 1))::integer);

    select * into v_product
    from public.store_products
    where id = v_product_id
      and status = 'active'
    for update;

    if not found then
      raise exception 'product_not_found:%', v_product_id;
    end if;

    if v_product.stock is not null and v_product.stock < v_qty then
      raise exception 'insufficient_stock:%:%', v_product_id, v_product.stock;
    end if;

    v_line_total := round(v_product.price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'emoji', coalesce(nullif(trim(v_product.emoji), ''), '🧺'),
      'qty', v_qty,
      'unit_price', v_product.price,
      'line_total', v_line_total
    ));
  end loop;

  if coalesce(v_settings.promo_min, 0) > 0
     and coalesce(v_settings.promo_discount, 0) > 0
     and v_subtotal >= v_settings.promo_min then
    v_promo := v_settings.promo_discount;
  else
    v_promo := 0;
  end if;

  if coalesce(v_settings.free_shipping_min, 0) > 0
     and (v_subtotal - v_promo) >= v_settings.free_shipping_min then
    v_shipping := 0;
  else
    v_shipping := greatest(0, coalesce(v_settings.shipping_fee, 0));
  end if;

  v_total := greatest(0, v_subtotal - v_promo + v_shipping);

  v_items_sig := md5(v_lines::text);

  if length(v_phone_norm) >= 9 then
    select o.id into v_dup_id
    from public.store_orders o
    where o.created_at > (v_now - interval '120 seconds')
      and o.stock_restocked = false
      and o.total = v_total
      and regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone_norm
      and md5((
        select coalesce(jsonb_agg(jsonb_build_object(
          'product_id', i.product_id,
          'qty', i.qty,
          'unit_price', i.unit_price
        ) order by i.product_id)::text, '[]')
        from public.store_order_items i
        where i.order_id = o.id
      )) = v_items_sig
    order by o.created_at desc
    limit 1;

    if v_dup_id is not null then
      return v_dup_id;
    end if;
  end if;

  update public.store_shop_settings
     set order_seq = order_seq + 1,
         updated_at = v_now
   where id = 'default'
   returning order_seq - 1 into v_seq;

  if v_seq is null then
    v_seq := 1;
  end if;

  v_id := format('RW%s-%s', v_day, lpad(v_seq::text, 3, '0'));

  insert into public.store_orders (
    id,
    customer_name,
    customer_phone,
    phone_display,
    customer_address,
    note,
    method,
    subtotal,
    promo_discount,
    shipping_fee,
    total,
    status_index,
    history,
    payment_slip,
    slip_uploaded_at,
    stock_restocked
  ) values (
    v_id,
    trim(p_customer_name),
    coalesce(trim(p_customer_phone), ''),
    coalesce(trim(p_phone_display), ''),
    coalesce(trim(p_customer_address), ''),
    coalesce(trim(p_note), ''),
    v_method,
    v_subtotal,
    v_promo,
    v_shipping,
    v_total,
    0,
    jsonb_build_array(jsonb_build_object('index', 0, 'at', (extract(epoch from v_now) * 1000)::bigint)),
    nullif(p_payment_slip, ''),
    case when nullif(p_payment_slip, '') is null then null else v_now end,
    false
  );

  insert into public.store_order_items (
    order_id,
    product_id,
    product_name,
    emoji,
    qty,
    unit_price,
    line_total
  )
  select
    v_id,
    (x->>'product_id'),
    (x->>'name'),
    (x->>'emoji'),
    (x->>'qty')::integer,
    (x->>'unit_price')::numeric,
    (x->>'line_total')::numeric
  from jsonb_array_elements(v_lines) as t(x);

  for v_item in select * from jsonb_array_elements(v_lines)
  loop
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'qty')::integer;
    update public.store_products
       set stock = stock - v_qty,
           updated_at = v_now
     where id = v_product_id
       and stock is not null;
  end loop;

  return v_id;
end;
$$;

revoke all on function public.store_create_order(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, jsonb
) from public;
grant execute on function public.store_create_order(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, jsonb
) to anon, authenticated;

-- =============================================================================
-- End of 010
-- =============================================================================
