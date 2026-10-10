-- =============================================================================
-- 011 — Harden admin auth + customer/order search (additive, no data loss)
-- Project: Rachawei-store ONLY
-- Safe to re-run.
--
-- Fixes:
--   1) Disable first-user claim admin (store_claim_first_admin no longer grants)
--   2) Ensure RLS on store_* uses store_is_admin() (not using(true) for auth users)
--   3) Add store_admin_search_orders(p_query, p_limit) for phone / order id search
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

-- Never allow direct client INSERT/UPDATE/DELETE on store_admins
drop policy if exists "store_admins_client_insert" on public.store_admins;
drop policy if exists "store_admins_client_update" on public.store_admins;
drop policy if exists "store_admins_client_delete" on public.store_admins;

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

-- -----------------------------------------------------------------------------
-- Disable first-signup / first-login admin claim
-- Keep function name so old clients get a clear error instead of silent grant.
-- -----------------------------------------------------------------------------
create or replace function public.store_claim_first_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if public.store_is_admin() then
    return jsonb_build_object('ok', true, 'claimed', false, 'already_admin', true);
  end if;

  -- Intentionally disabled: never auto-promote the first Auth user.
  raise exception 'bootstrap_disabled'
    using hint = 'Use store_link_admin_by_email in SQL Editor or POST /api/store-admin-bootstrap with server secret';
end;
$$;

revoke all on function public.store_claim_first_admin() from public;
-- Keep execute for authenticated so login flow receives bootstrap_disabled (not 404),
-- but the function never inserts into store_admins for non-admins.
grant execute on function public.store_claim_first_admin() to authenticated;

-- Link helper: SQL Editor / service_role only (no grant to anon/authenticated)
create or replace function public.store_link_admin_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
begin
  if p_email is null or length(trim(p_email)) < 3 then
    raise exception 'email_required';
  end if;

  select id, email into v_id, v_email
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_id is null then
    raise exception 'auth_user_not_found';
  end if;

  insert into public.store_admins (user_id, email)
  values (v_id, v_email)
  on conflict (user_id) do update set email = excluded.email;

  return jsonb_build_object('ok', true, 'user_id', v_id, 'email', v_email);
end;
$$;

revoke all on function public.store_link_admin_by_email(text) from public;

-- -----------------------------------------------------------------------------
-- Harden table RLS: authenticated must be store_admins for privileged ops
-- -----------------------------------------------------------------------------
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

  if to_regclass('public.store_admins') is not null then
    execute 'grant select on public.store_admins to authenticated';
  end if;
end $$;

-- Helpful indexes for admin search (safe if already present)
create index if not exists store_orders_customer_phone_idx
  on public.store_orders (customer_phone);
create index if not exists store_orders_phone_display_idx
  on public.store_orders (phone_display);
create index if not exists store_orders_created_at_idx
  on public.store_orders (created_at desc);

-- -----------------------------------------------------------------------------
-- Admin search by phone digits and/or order id (parameterized — no SQL injection)
-- -----------------------------------------------------------------------------
create or replace function public.store_admin_search_orders(
  p_query text default '',
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 200));
  v_raw text := trim(coalesce(p_query, ''));
  v_q text := lower(v_raw);
  v_digits text := regexp_replace(v_raw, '\D', '', 'g');
  -- Phone mode only when query is digits / phone punctuation (not letters+digits like ZZZ999)
  v_phone_mode boolean := (v_raw ~ '^[0-9+().\-\s]+$') and length(v_digits) >= 3;
  v_result jsonb;
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;

  if v_q = '' then
    return '[]'::jsonb;
  end if;

  -- Thai mobile often stored as 08xxxxxxxx or 668xxxxxxxx — compare digit tails in phone mode
  select coalesce(
    jsonb_agg(row_json order by created_at desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      o.created_at,
      jsonb_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'phone_display', o.phone_display,
        'customer_address', o.customer_address,
        'note', o.note,
        'method', o.method,
        'subtotal', o.subtotal,
        'promo_discount', o.promo_discount,
        'shipping_fee', o.shipping_fee,
        'total', o.total,
        'status_index', o.status_index,
        'history', o.history,
        'payment_slip', case when o.payment_slip is null or o.payment_slip = '' then null else '[attached]' end,
        'slip_uploaded_at', o.slip_uploaded_at,
        'created_at', o.created_at,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'product_id', i.product_id,
              'product_name', i.product_name,
              'emoji', i.emoji,
              'qty', i.qty,
              'unit_price', i.unit_price,
              'line_total', i.line_total
            )
            order by i.created_at
          )
          from public.store_order_items i
          where i.order_id = o.id
        ), '[]'::jsonb)
      ) as row_json
    from public.store_orders o
    where
      (
        lower(o.id) = v_q
        or lower(o.id) like '%' || v_q || '%'
        or lower(coalesce(o.customer_name, '')) like '%' || v_q || '%'
      )
      or (v_phone_mode and (
        regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') like '%' || v_digits || '%'
        or regexp_replace(coalesce(o.phone_display, ''), '\D', '', 'g') like '%' || v_digits || '%'
        or (
          length(v_digits) >= 9 and (
            right(regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g'), 9)
              = right(v_digits, 9)
            or right(regexp_replace(coalesce(o.phone_display, ''), '\D', '', 'g'), 9)
              = right(v_digits, 9)
          )
        )
      ))
    order by o.created_at desc
    limit v_limit
  ) matched;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.store_admin_search_orders(text, integer) from public;
grant execute on function public.store_admin_search_orders(text, integer) to authenticated;

-- Ensure list_orders still admin-gated (re-assert from 006)
create or replace function public.store_admin_list_orders(p_limit integer default 200)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 500));
  v_result jsonb;
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'phone_display', o.phone_display,
        'customer_address', o.customer_address,
        'note', o.note,
        'method', o.method,
        'subtotal', o.subtotal,
        'promo_discount', o.promo_discount,
        'shipping_fee', o.shipping_fee,
        'total', o.total,
        'status_index', o.status_index,
        'history', o.history,
        'payment_slip', o.payment_slip,
        'slip_uploaded_at', o.slip_uploaded_at,
        'created_at', o.created_at,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'product_id', i.product_id,
              'product_name', i.product_name,
              'emoji', i.emoji,
              'qty', i.qty,
              'unit_price', i.unit_price,
              'line_total', i.line_total
            )
            order by i.created_at
          )
          from public.store_order_items i
          where i.order_id = o.id
        ), '[]'::jsonb)
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select *
    from public.store_orders
    order by created_at desc
    limit v_limit
  ) o;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.store_admin_list_orders(integer) from public;
grant execute on function public.store_admin_list_orders(integer) to authenticated;
