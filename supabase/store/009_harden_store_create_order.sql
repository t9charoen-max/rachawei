-- =============================================================================
-- Rachawei-store — 009 harden order create + slip attach + public lookup
-- Safe / non-destructive. Does NOT delete products or orders.
-- Requires: 003/004 create_order + 006 admin grants already applied.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Hardened store_create_order
--    - Recompute line prices from store_products (ignore client unit prices)
--    - Apply promo / shipping from store_shop_settings
--    - Lock + decrement stock; reject insufficient stock
--    - Unique order ids via atomic order_seq (unchanged)
-- -----------------------------------------------------------------------------
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

    if v_product.stock is not null then
      update public.store_products
         set stock = stock - v_qty,
             updated_at = v_now
       where id = v_product.id;
    end if;
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
    slip_uploaded_at
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
    case when nullif(p_payment_slip, '') is null then null else v_now end
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

  -- Client-supplied totals are intentionally ignored (p_subtotal/p_promo/p_shipping/p_total).
  return v_id;
end;
$$;

revoke all on function public.store_create_order(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, jsonb
) from public;
grant execute on function public.store_create_order(
  text, text, text, text, text, text, numeric, numeric, numeric, numeric, text, jsonb
) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Attach payment slip after checkout (phone-verified)
-- -----------------------------------------------------------------------------
create or replace function public.store_attach_payment_slip(
  p_order_id text,
  p_customer_phone text,
  p_payment_slip text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.store_orders%rowtype;
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  v_order_phone text;
  v_slip text := nullif(trim(p_payment_slip), '');
begin
  if p_order_id is null or length(trim(p_order_id)) < 4 then
    raise exception 'order_id_required';
  end if;
  if v_slip is null or length(v_slip) < 32 then
    raise exception 'payment_slip_required';
  end if;
  if length(v_slip) > 600000 then
    raise exception 'payment_slip_too_large';
  end if;
  if length(v_phone) < 9 then
    raise exception 'phone_required';
  end if;

  select * into v_order
  from public.store_orders
  where id = trim(p_order_id)
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  v_order_phone := regexp_replace(coalesce(v_order.customer_phone, ''), '\D', '', 'g');
  if v_order_phone = '' then
    v_order_phone := regexp_replace(coalesce(v_order.phone_display, ''), '\D', '', 'g');
  end if;

  -- Accept 0xxxxxxxxx vs xxxxxxxxx
  if v_order_phone is distinct from v_phone
     and ('0' || v_order_phone) is distinct from v_phone
     and v_order_phone is distinct from ('0' || v_phone)
     and right(v_order_phone, 9) is distinct from right(v_phone, 9) then
    raise exception 'phone_mismatch';
  end if;

  update public.store_orders
     set payment_slip = v_slip,
         slip_uploaded_at = now(),
         updated_at = now()
   where id = v_order.id;

  return true;
end;
$$;

revoke all on function public.store_attach_payment_slip(text, text, text) from public;
grant execute on function public.store_attach_payment_slip(text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3) Public order lookup (status tracking) — by order id or phone
--    Does not expose payment_slip data URLs to reduce payload / abuse.
-- -----------------------------------------------------------------------------
create or replace function public.store_lookup_orders(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q text := lower(trim(coalesce(p_query, '')));
  v_digits text := regexp_replace(v_q, '\D', '', 'g');
  v_result jsonb := '[]'::jsonb;
begin
  if length(v_q) < 3 then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc), '[]'::jsonb)
    into v_result
  from (
    select
      o.id,
      o.customer_name,
      o.customer_phone,
      o.phone_display,
      o.customer_address,
      o.note,
      o.method,
      o.subtotal,
      o.promo_discount,
      o.shipping_fee,
      o.total,
      o.status_index,
      o.history,
      o.created_at,
      (o.payment_slip is not null) as has_payment_slip,
      o.slip_uploaded_at,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'product_id', i.product_id,
          'product_name', i.product_name,
          'emoji', i.emoji,
          'qty', i.qty,
          'unit_price', i.unit_price,
          'line_total', i.line_total
        ) order by i.created_at)
        from public.store_order_items i
        where i.order_id = o.id
      ), '[]'::jsonb) as items
    from public.store_orders o
    where
      lower(o.id) = v_q
      or replace(lower(o.id), '-', '') = replace(v_q, '-', '')
      or (
        length(v_digits) >= 9
        and (
          regexp_replace(o.customer_phone, '\D', '', 'g') = v_digits
          or regexp_replace(o.phone_display, '\D', '', 'g') = v_digits
          or right(regexp_replace(o.customer_phone, '\D', '', 'g'), 9) = right(v_digits, 9)
          or right(regexp_replace(o.phone_display, '\D', '', 'g'), 9) = right(v_digits, 9)
        )
      )
    order by o.created_at desc
    limit 20
  ) t;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.store_lookup_orders(text) from public;
grant execute on function public.store_lookup_orders(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) Tighten direct anon inserts — prefer SECURITY DEFINER RPCs only
--    Admin policies from 003/006 remain for authenticated admins.
-- -----------------------------------------------------------------------------
drop policy if exists "store_orders_public_insert" on public.store_orders;
drop policy if exists "store_order_items_public_insert" on public.store_order_items;

-- =============================================================================
-- End of 009
-- =============================================================================
