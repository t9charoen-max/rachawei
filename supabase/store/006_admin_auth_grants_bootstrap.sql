-- =============================================================================
-- 006 — Admin Auth grants + first-admin bootstrap + list orders
-- Safe / additive. Does NOT drop tables or delete data.
-- Run in Supabase SQL Editor (Rachawei-store project only).
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

-- Table privileges required in addition to RLS policies
do $$
begin
  if to_regclass('public.store_products') is not null then
    execute 'grant select on public.store_products to anon, authenticated';
    execute 'grant select, insert, update, delete on public.store_products to authenticated';
  end if;
  if to_regclass('public.store_orders') is not null then
    execute 'grant insert on public.store_orders to anon, authenticated';
    execute 'grant select, update, delete on public.store_orders to authenticated';
  end if;
  if to_regclass('public.store_order_items') is not null then
    execute 'grant insert on public.store_order_items to anon, authenticated';
    execute 'grant select, update, delete on public.store_order_items to authenticated';
  end if;
  if to_regclass('public.store_shop_settings') is not null then
    execute 'grant select on public.store_shop_settings to authenticated';
    execute 'grant insert, update, delete on public.store_shop_settings to authenticated';
  end if;
  if to_regclass('public.store_videos') is not null then
    execute 'grant select on public.store_videos to anon, authenticated';
    execute 'grant insert, update, delete on public.store_videos to authenticated';
  end if;
  if to_regclass('public.store_admins') is not null then
    execute 'grant select on public.store_admins to authenticated';
  end if;
  if to_regclass('public.store_shop_settings_public') is not null then
    execute 'grant select on public.store_shop_settings_public to anon, authenticated';
  end if;
end $$;

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

-- First-user auto-claim DISABLED (security).
-- Promote admins only via store_link_admin_by_email (SQL Editor / service role)
-- or POST /api/store-admin-bootstrap with STORE_ADMIN_BOOTSTRAP_SECRET.
-- See also 011_admin_security_search.sql for hardening + search RPC.
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

  raise exception 'bootstrap_disabled'
    using hint = 'Use store_link_admin_by_email in SQL Editor or POST /api/store-admin-bootstrap with server secret';
end;
$$;

revoke all on function public.store_claim_first_admin() from public;
grant execute on function public.store_claim_first_admin() to authenticated;

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

-- Helper: link an existing Auth user by email (run as postgres in SQL Editor)
-- Example after creating the Auth user in Dashboard:
--   select public.store_link_admin_by_email('owner@yourdomain.com');
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
-- Intentionally NOT granted to anon/authenticated — SQL Editor / service role only
