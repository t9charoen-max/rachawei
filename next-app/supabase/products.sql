-- สร้างตาราง products สำหรับแคตตาล็อกสินค้า
-- รันใน Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  unit text not null default 'ชิ้น',
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

alter table public.products enable row level security;

drop policy if exists "สินค้าอ่านได้ทุกคน" on public.products;
create policy "สินค้าอ่านได้ทุกคน"
  on public.products
  for select
  using (is_active = true);

-- ข้อมูลตัวอย่าง (ราชาหวาย)
insert into public.products (name, description, category, price, unit, stock) values
  (
    'ตะกร้าหวายสี่เหลี่ยมจัตุรัส 2 ชั้น',
    'ตะกร้าหวายทรงสี่เหลี่ยมจัตุรัส 2 ชั้น หูจับสูง ลายสานโปร่ง งานพิเศษสานมือจากช่างฝีมือบ้านบุทม',
    'พิเศษ',
    890.00,
    'ชิ้น',
    12
  ),
  (
    'เก้าอี้หวาย ทรงกลม',
    'เก้าอี้หวายทรงกลมสานมือ ชุดคู่พร้อมโต๊ะหวาย ดีไซน์หลังมน นั่งสบาย',
    'เก้าอี้',
    4500.00,
    'ชุด',
    4
  ),
  (
    'เก้าอี้หวาย',
    'เก้าอี้หวายสานมือ พร้อมโต๊ะหวาย ดีไซน์โค้งมน เหมาะมุมนั่งเล่นและมุมสวน',
    'เก้าอี้',
    3800.00,
    'ชุด',
    6
  ),
  (
    'ตะกร้าหวายรีเหลี่ยม 2 ชั้น พิเศษ',
    'ตะกร้าหวายทรงรีเหลี่ยม 2 ชั้น ปากหยัก หูจับสูง ลายสานโปร่ง งานพิเศษสานมือ',
    'พิเศษ',
    750.00,
    'ชิ้น',
    8
  ),
  (
    'ตะกร้ากลม 2 ชั้น ถักปาก',
    'ตะกร้าหวายทรงกลม 2 ชั้น ปากถักตกแต่ง หูจับสูง งานสานมือจากช่างฝีมือบ้านบุทม',
    'ทรงกลม',
    420.00,
    'ชิ้น',
    20
  ),
  (
    'ตะกร้าหวายทรงกลมปากหยัก',
    'ตะกร้าหวายทรงกลมปากหยัก หูจับสูง ลายสานถี่ งานประณีตจากช่างบ้านบุทม',
    'หูจับสูง',
    350.00,
    'ชิ้น',
    15
  ),
  (
    'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว',
    'ตะกร้าหวายทรงกลม ฐาน 11 นิ้ว หูจับมั่นคง สานมือ 100%',
    'ทรงกลม',
    280.00,
    'ชิ้น',
    25
  ),
  (
    'ตะกร้าหวายมีฝา ชุดคู่',
    'ตะกร้าหวายมีฝาปิด ชุดคู่ ลายสานละเอียด เหมาะเป็นของฝาก',
    'มีฝา',
    520.00,
    'ชุด',
    10
  ),
  (
    'ตะกร้าหวายทรงเหลี่ยมมีฝา',
    'ตะกร้าหวายทรงเหลี่ยมมีฝา หูจับมั่นคง ลายสานโปร่งตรงกลาง วางซ้อนได้สะดวก',
    'ทรงเหลี่ยม',
    480.00,
    'ชิ้น',
    3
  ),
  (
    'ตะกร้าหวาย 8 เหลี่ยม ชั้นเดียว',
    'ตะกร้าหวายทรงแปดเหลี่ยม ชั้นเดียว หูจับสูง ลายสานเนี้ยบ งานพิเศษจากช่างฝีมือบ้านบุทม',
    'พิเศษ',
    650.00,
    'ชิ้น',
    0
  );
