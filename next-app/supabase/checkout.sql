-- โซนจัดส่ง + ออเดอร์ สำหรับหน้า Checkout
-- รันใน Supabase SQL Editor หลังจาก products.sql

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  fee numeric(10, 2) not null check (fee >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  note text not null default '',
  delivery_zone_id uuid not null references public.delivery_zones (id),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  unit text not null,
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "โซนจัดส่งอ่านได้ทุกคน" on public.delivery_zones;
create policy "โซนจัดส่งอ่านได้ทุกคน"
  on public.delivery_zones
  for select
  using (is_active = true);

drop policy if exists "สร้างออเดอร์ได้ทุกคน" on public.orders;
create policy "สร้างออเดอร์ได้ทุกคน"
  on public.orders
  for insert
  with check (true);

drop policy if exists "สร้างรายการออเดอร์ได้ทุกคน" on public.order_items;
create policy "สร้างรายการออเดอร์ได้ทุกคน"
  on public.order_items
  for insert
  with check (true);

-- อนุญาตให้อ่านออเดอร์หลังสร้าง (สำหรับหน้ายืนยัน)
drop policy if exists "อ่านออเดอร์ที่สร้างได้" on public.orders;
create policy "อ่านออเดอร์ที่สร้างได้"
  on public.orders
  for select
  using (true);

drop policy if exists "อ่านรายการออเดอร์ได้" on public.order_items;
create policy "อ่านรายการออเดอร์ได้"
  on public.order_items
  for select
  using (true);

insert into public.delivery_zones (name, description, fee, sort_order) values
  ('สุรินทร์ — ในเมือง', 'อำเภอเมืองและพื้นที่ใกล้เคียง', 50.00, 1),
  ('สุรินทร์ — ชานเมือง', 'อำเภออื่นในจังหวัดสุรินทร์', 80.00, 2),
  ('อีสานใกล้เคียง', 'จังหวัดใกล้เคียง เช่น บุรีรัมย์ ศรีสะเกษ', 120.00, 3),
  ('กรุงเทพและปริมณฑล', 'กรุงเทพ นนทบุรี ปทุมธานี สมุทรปราการ', 150.00, 4),
  ('ทั่วประเทศ', 'จังหวัดอื่น ๆ ทั่วไทย', 200.00, 5)
on conflict do nothing;

-- หักสต็อกอัตโนมัติเมื่อมีรายการออเดอร์ใหม่
create or replace function public.decrement_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = stock - new.quantity
  where id = new.product_id
    and stock >= new.quantity;

  if not found then
    raise exception 'สต็อกสินค้าไม่เพียงพอ';
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_decrement_stock on public.order_items;
create trigger order_items_decrement_stock
after insert on public.order_items
for each row
execute function public.decrement_product_stock();
