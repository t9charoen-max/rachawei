-- =============================================================================
-- Rachawei-store — schema for /store/ (ราชาหวายสุรินทร์)
-- Project target: Rachawei-store (ONLY)
--
-- DO NOT RUN until the shop owner approves this file.
-- DO NOT apply to other projects (e.g. happy-life-clinic). Rachawei-store only.
-- DO NOT drop or alter any existing non-store_* tables.
--
-- Tables (store_ prefix only):
--   store_products
--   store_orders
--   store_order_items
--   store_shop_settings
--   store_videos
--
-- Auth model (no service_role in frontend):
--   - anon / public: read active products, read public shop settings view,
--     read active videos, insert orders + order_items
--   - authenticated: full admin CRUD on store_* (shop owners signed in
--     via Supabase Auth on this dedicated project)
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.store_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1) store_products
--    Maps public/catalog/products.json (+ admin edits)
--    featured  <= catalog field "special"
--    store_cat <= catalog field "storeCat"
-- -----------------------------------------------------------------------------
create table if not exists public.store_products (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  images jsonb not null default '[]'::jsonb,
  category text not null default '',
  store_cat text not null default '',
  stock integer not null default 0 check (stock >= 0),
  emoji text not null default '🧺',
  badge text,
  featured boolean not null default false,
  size text,
  panorama360 text,
  status text not null default 'active'
    check (status in ('active', 'hidden', 'draft')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_products_images_is_array check (jsonb_typeof(images) = 'array')
);

create index if not exists store_products_status_idx
  on public.store_products (status);

create index if not exists store_products_store_cat_idx
  on public.store_products (store_cat);

create index if not exists store_products_sort_idx
  on public.store_products (sort_order, id);

drop trigger if exists store_products_set_updated_at on public.store_products;
create trigger store_products_set_updated_at
  before update on public.store_products
  for each row execute function public.store_set_updated_at();

-- -----------------------------------------------------------------------------
-- 2) store_orders
--    Maps createOrder() in artifacts/js/app.js
--    id format example: RW20261005-001
-- -----------------------------------------------------------------------------
create table if not exists public.store_orders (
  id text primary key,
  customer_name text not null,
  customer_phone text not null default '',
  phone_display text not null default '',
  customer_address text not null default '',
  note text not null default '',
  method text not null default 'transfer'
    check (method in ('transfer', 'cod', 'promptpay', 'other')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  promo_discount numeric(12, 2) not null default 0 check (promo_discount >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  status_index integer not null default 0 check (status_index >= 0),
  history jsonb not null default '[]'::jsonb,
  payment_slip text,
  slip_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_orders_history_is_array check (jsonb_typeof(history) = 'array')
);

create index if not exists store_orders_created_at_idx
  on public.store_orders (created_at desc);

create index if not exists store_orders_status_idx
  on public.store_orders (status_index);

drop trigger if exists store_orders_set_updated_at on public.store_orders;
create trigger store_orders_set_updated_at
  before update on public.store_orders
  for each row execute function public.store_set_updated_at();

-- -----------------------------------------------------------------------------
-- 3) store_order_items
-- -----------------------------------------------------------------------------
create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.store_orders (id) on delete cascade,
  product_id text references public.store_products (id) on delete set null,
  product_name text not null,
  emoji text not null default '🧺',
  qty integer not null check (qty > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_order_items_order_id_idx
  on public.store_order_items (order_id);

create index if not exists store_order_items_product_id_idx
  on public.store_order_items (product_id);

drop trigger if exists store_order_items_set_updated_at on public.store_order_items;
create trigger store_order_items_set_updated_at
  before update on public.store_order_items
  for each row execute function public.store_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4) store_shop_settings
--    Single-row shop config + CMS content (SHOP_CONFIG + STORE_CONTENT)
--    admin_pin_hash is NOT exposed on the public view
-- -----------------------------------------------------------------------------
create table if not exists public.store_shop_settings (
  id text primary key default 'default',
  shop_name text not null default 'ราชาหวายสุรินทร์',
  shop_sub text not null default '',
  phone_display text not null default '',
  phone_tel text not null default '',
  line_url text not null default '',
  facebook_url text not null default '',
  map_url text not null default '',
  address_html text not null default '',
  promo_min numeric(12, 2) not null default 0,
  promo_discount numeric(12, 2) not null default 0,
  shipping_fee numeric(12, 2) not null default 0,
  free_shipping_min numeric(12, 2) not null default 0,
  bank_name text not null default '',
  bank_account_name text not null default '',
  promptpay_no text not null default '',
  bank_account_no text not null default '',
  bank_note text not null default '',
  hero_images jsonb not null default '[]'::jsonb,
  storefront_photos jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  admin_pin_hash text,
  order_seq integer not null default 1 check (order_seq >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_shop_settings_hero_images_is_array
    check (jsonb_typeof(hero_images) = 'array'),
  constraint store_shop_settings_storefront_photos_is_array
    check (jsonb_typeof(storefront_photos) = 'array'),
  constraint store_shop_settings_content_is_object
    check (jsonb_typeof(content) = 'object')
);

drop trigger if exists store_shop_settings_set_updated_at on public.store_shop_settings;
create trigger store_shop_settings_set_updated_at
  before update on public.store_shop_settings
  for each row execute function public.store_set_updated_at();

-- Public-safe projection (no admin_pin_hash)
create or replace view public.store_shop_settings_public
with (security_invoker = true)
as
select
  id,
  shop_name,
  shop_sub,
  phone_display,
  phone_tel,
  line_url,
  facebook_url,
  map_url,
  address_html,
  promo_min,
  promo_discount,
  shipping_fee,
  free_shipping_min,
  bank_name,
  bank_account_name,
  promptpay_no,
  bank_account_no,
  bank_note,
  hero_images,
  storefront_photos,
  content,
  created_at,
  updated_at
from public.store_shop_settings;

-- -----------------------------------------------------------------------------
-- 5) store_videos
--    Maps shopVideos[] in artifacts/js/app.js
-- -----------------------------------------------------------------------------
create table if not exists public.store_videos (
  id bigint generated by default as identity primary key,
  title text not null default '',
  video_url text not null,
  product_id text references public.store_products (id) on delete set null,
  thumbnail text,
  views integer not null default 0 check (views >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_videos_sort_idx
  on public.store_videos (sort_order, id);

create index if not exists store_videos_product_id_idx
  on public.store_videos (product_id);

drop trigger if exists store_videos_set_updated_at on public.store_videos;
create trigger store_videos_set_updated_at
  before update on public.store_videos
  for each row execute function public.store_set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.store_products enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;
alter table public.store_shop_settings enable row level security;
alter table public.store_videos enable row level security;

-- store_products
drop policy if exists "store_products_public_read_active" on public.store_products;
create policy "store_products_public_read_active"
  on public.store_products
  for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "store_products_admin_read_all" on public.store_products;
create policy "store_products_admin_read_all"
  on public.store_products
  for select
  to authenticated
  using (true);

drop policy if exists "store_products_admin_insert" on public.store_products;
create policy "store_products_admin_insert"
  on public.store_products
  for insert
  to authenticated
  with check (true);

drop policy if exists "store_products_admin_update" on public.store_products;
create policy "store_products_admin_update"
  on public.store_products
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "store_products_admin_delete" on public.store_products;
create policy "store_products_admin_delete"
  on public.store_products
  for delete
  to authenticated
  using (true);

-- store_orders: customers create; admins manage
drop policy if exists "store_orders_public_insert" on public.store_orders;
create policy "store_orders_public_insert"
  on public.store_orders
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "store_orders_admin_select" on public.store_orders;
create policy "store_orders_admin_select"
  on public.store_orders
  for select
  to authenticated
  using (true);

drop policy if exists "store_orders_admin_update" on public.store_orders;
create policy "store_orders_admin_update"
  on public.store_orders
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "store_orders_admin_delete" on public.store_orders;
create policy "store_orders_admin_delete"
  on public.store_orders
  for delete
  to authenticated
  using (true);

-- store_order_items
drop policy if exists "store_order_items_public_insert" on public.store_order_items;
create policy "store_order_items_public_insert"
  on public.store_order_items
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "store_order_items_admin_select" on public.store_order_items;
create policy "store_order_items_admin_select"
  on public.store_order_items
  for select
  to authenticated
  using (true);

drop policy if exists "store_order_items_admin_update" on public.store_order_items;
create policy "store_order_items_admin_update"
  on public.store_order_items
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "store_order_items_admin_delete" on public.store_order_items;
create policy "store_order_items_admin_delete"
  on public.store_order_items
  for delete
  to authenticated
  using (true);

-- store_shop_settings: anon cannot read base table (use public view);
-- authenticated (admin) full access including admin_pin_hash
drop policy if exists "store_shop_settings_admin_select" on public.store_shop_settings;
create policy "store_shop_settings_admin_select"
  on public.store_shop_settings
  for select
  to authenticated
  using (true);

drop policy if exists "store_shop_settings_admin_insert" on public.store_shop_settings;
create policy "store_shop_settings_admin_insert"
  on public.store_shop_settings
  for insert
  to authenticated
  with check (true);

drop policy if exists "store_shop_settings_admin_update" on public.store_shop_settings;
create policy "store_shop_settings_admin_update"
  on public.store_shop_settings
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "store_shop_settings_admin_delete" on public.store_shop_settings;
create policy "store_shop_settings_admin_delete"
  on public.store_shop_settings
  for delete
  to authenticated
  using (true);

-- Public view grants (no pin hash)
grant select on public.store_shop_settings_public to anon, authenticated;

-- store_videos
drop policy if exists "store_videos_public_read_active" on public.store_videos;
create policy "store_videos_public_read_active"
  on public.store_videos
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "store_videos_admin_read_all" on public.store_videos;
create policy "store_videos_admin_read_all"
  on public.store_videos
  for select
  to authenticated
  using (true);

drop policy if exists "store_videos_admin_insert" on public.store_videos;
create policy "store_videos_admin_insert"
  on public.store_videos
  for insert
  to authenticated
  with check (true);

drop policy if exists "store_videos_admin_update" on public.store_videos;
create policy "store_videos_admin_update"
  on public.store_videos
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "store_videos_admin_delete" on public.store_videos;
create policy "store_videos_admin_delete"
  on public.store_videos
  for delete
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Default settings row (safe defaults; CMS content filled later by app/seed)
-- -----------------------------------------------------------------------------
insert into public.store_shop_settings (id)
values ('default')
on conflict (id) do nothing;

-- =============================================================================
-- End of schema migration — see 002_rachawei_store_seed_products.sql for seed
-- =============================================================================
