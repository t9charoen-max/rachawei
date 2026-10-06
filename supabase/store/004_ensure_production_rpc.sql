-- =============================================================================
-- Rachawei-store — 004 ensure production RPCs only (safe / non-destructive)
-- Does NOT drop tables. Does NOT delete/update store_products rows.
-- Safe to re-run. Use if store_admins already exists but RPCs may be missing.
-- =============================================================================

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;

drop policy if exists "store_admins_self_select" on public.store_admins;
create policy "store_admins_self_select"
  on public.store_admins
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.store_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.store_is_admin() from public;
grant execute on function public.store_is_admin() to anon, authenticated;

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
  v_price numeric;
  v_name text;
  v_emoji text;
  v_product_id text;
  v_now timestamptz := now();
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

  if coalesce(p_total, 0) < 0
     or coalesce(p_subtotal, 0) < 0
     or coalesce(p_promo_discount, 0) < 0
     or coalesce(p_shipping_fee, 0) < 0 then
    raise exception 'invalid_totals';
  end if;

  update public.store_shop_settings
     set order_seq = order_seq + 1,
         updated_at = v_now
   where id = 'default'
   returning order_seq - 1 into v_seq;

  if v_seq is null then
    insert into public.store_shop_settings (id, order_seq)
    values ('default', 2)
    on conflict (id) do update
      set order_seq = public.store_shop_settings.order_seq + 1,
          updated_at = v_now
    returning order_seq - 1 into v_seq;
  end if;

  v_id := format('RW%s-%s', v_day, lpad(v_seq::text, 3, '0'));

  insert into public.store_orders (
    id, customer_name, customer_phone, phone_display, customer_address, note,
    method, subtotal, promo_discount, shipping_fee, total, status_index, history,
    payment_slip, slip_uploaded_at
  ) values (
    v_id,
    trim(p_customer_name),
    coalesce(trim(p_customer_phone), ''),
    coalesce(trim(p_phone_display), ''),
    coalesce(trim(p_customer_address), ''),
    coalesce(trim(p_note), ''),
    v_method,
    coalesce(p_subtotal, 0),
    coalesce(p_promo_discount, 0),
    coalesce(p_shipping_fee, 0),
    coalesce(p_total, 0),
    0,
    jsonb_build_array(jsonb_build_object('index', 0, 'at', (extract(epoch from v_now) * 1000)::bigint)),
    nullif(p_payment_slip, ''),
    case when nullif(p_payment_slip, '') is null then null else v_now end
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, floor(coalesce((v_item->>'qty')::numeric, 1))::integer);
    v_price := greatest(0, coalesce((v_item->>'price')::numeric, 0));
    v_name := coalesce(nullif(trim(v_item->>'name'), ''), 'สินค้า');
    v_emoji := coalesce(nullif(trim(v_item->>'emoji'), ''), '🧺');
    v_product_id := nullif(trim(v_item->>'id'), '');

    insert into public.store_order_items (
      order_id, product_id, product_name, emoji, qty, unit_price, line_total
    ) values (
      v_id,
      case
        when v_product_id is not null
          and exists (select 1 from public.store_products p where p.id = v_product_id)
        then v_product_id
        else null
      end,
      v_name,
      v_emoji,
      v_qty,
      v_price,
      v_qty * v_price
    );
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

-- Tighten admin policies only (no data changes)
do $$
begin
  if to_regclass('public.store_products') is not null then
    execute 'drop policy if exists "store_products_admin_read_all" on public.store_products';
    execute 'create policy "store_products_admin_read_all" on public.store_products for select to authenticated using (public.store_is_admin())';
    execute 'drop policy if exists "store_products_admin_insert" on public.store_products';
    execute 'create policy "store_products_admin_insert" on public.store_products for insert to authenticated with check (public.store_is_admin())';
    execute 'drop policy if exists "store_products_admin_update" on public.store_products';
    execute 'create policy "store_products_admin_update" on public.store_products for update to authenticated using (public.store_is_admin()) with check (public.store_is_admin())';
    execute 'drop policy if exists "store_products_admin_delete" on public.store_products';
    execute 'create policy "store_products_admin_delete" on public.store_products for delete to authenticated using (public.store_is_admin())';
  end if;

  if to_regclass('public.store_orders') is not null then
    execute 'drop policy if exists "store_orders_admin_select" on public.store_orders';
    execute 'create policy "store_orders_admin_select" on public.store_orders for select to authenticated using (public.store_is_admin())';
    execute 'drop policy if exists "store_orders_admin_update" on public.store_orders';
    execute 'create policy "store_orders_admin_update" on public.store_orders for update to authenticated using (public.store_is_admin()) with check (public.store_is_admin())';
    execute 'drop policy if exists "store_orders_admin_delete" on public.store_orders';
    execute 'create policy "store_orders_admin_delete" on public.store_orders for delete to authenticated using (public.store_is_admin())';
  end if;

  if to_regclass('public.store_order_items') is not null then
    execute 'drop policy if exists "store_order_items_admin_select" on public.store_order_items';
    execute 'create policy "store_order_items_admin_select" on public.store_order_items for select to authenticated using (public.store_is_admin())';
    execute 'drop policy if exists "store_order_items_admin_update" on public.store_order_items';
    execute 'create policy "store_order_items_admin_update" on public.store_order_items for update to authenticated using (public.store_is_admin()) with check (public.store_is_admin())';
    execute 'drop policy if exists "store_order_items_admin_delete" on public.store_order_items';
    execute 'create policy "store_order_items_admin_delete" on public.store_order_items for delete to authenticated using (public.store_is_admin())';
  end if;

  if to_regclass('public.store_shop_settings') is not null then
    execute 'drop policy if exists "store_shop_settings_admin_select" on public.store_shop_settings';
    execute 'create policy "store_shop_settings_admin_select" on public.store_shop_settings for select to authenticated using (public.store_is_admin())';
    execute 'drop policy if exists "store_shop_settings_admin_insert" on public.store_shop_settings';
    execute 'create policy "store_shop_settings_admin_insert" on public.store_shop_settings for insert to authenticated with check (public.store_is_admin())';
    execute 'drop policy if exists "store_shop_settings_admin_update" on public.store_shop_settings';
    execute 'create policy "store_shop_settings_admin_update" on public.store_shop_settings for update to authenticated using (public.store_is_admin()) with check (public.store_is_admin())';
    execute 'drop policy if exists "store_shop_settings_admin_delete" on public.store_shop_settings';
    execute 'create policy "store_shop_settings_admin_delete" on public.store_shop_settings for delete to authenticated using (public.store_is_admin())';
  end if;

  if to_regclass('public.store_videos') is not null then
    execute 'drop policy if exists "store_videos_admin_read_all" on public.store_videos';
    execute 'create policy "store_videos_admin_read_all" on public.store_videos for select to authenticated using (public.store_is_admin())';
    execute 'drop policy if exists "store_videos_admin_insert" on public.store_videos';
    execute 'create policy "store_videos_admin_insert" on public.store_videos for insert to authenticated with check (public.store_is_admin())';
    execute 'drop policy if exists "store_videos_admin_update" on public.store_videos';
    execute 'create policy "store_videos_admin_update" on public.store_videos for update to authenticated using (public.store_is_admin()) with check (public.store_is_admin())';
    execute 'drop policy if exists "store_videos_admin_delete" on public.store_videos';
    execute 'create policy "store_videos_admin_delete" on public.store_videos for delete to authenticated using (public.store_is_admin())';
  end if;
end $$;
