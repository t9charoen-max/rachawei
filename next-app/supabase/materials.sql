-- Rachawatsadu — schema สำหรับแคตตาล็อกวัสดุก่อสร้าง + ใบขอราคา
-- รันใน Supabase SQL Editor

create table if not exists public.material_products (
  id text primary key,
  name text not null,
  description text not null default '',
  category text not null,
  spec text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  unit text not null default 'ชิ้น',
  stock integer not null default 0 check (stock >= 0),
  stock_status text not null default 'พร้อมส่ง' check (stock_status in ('พร้อมส่ง', 'เหลือน้อย')),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists material_products_category_idx on public.material_products (category);

alter table public.material_products enable row level security;

drop policy if exists "วัสดุอ่านได้ทุกคน" on public.material_products;
create policy "วัสดุอ่านได้ทุกคน"
  on public.material_products for select
  using (is_active = true);

-- ใบขอราคา
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null default '',
  note text not null default '',
  items jsonb not null default '[]'::jsonb,
  total_estimate numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'quoted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);

alter table public.quote_requests enable row level security;

-- อนุญาตให้ anon insert ใบขอราคา (หน้าเว็บลูกค้า)
drop policy if exists "ลูกค้าส่งใบขอราคาได้" on public.quote_requests;
create policy "ลูกค้าส่งใบขอราคาได้"
  on public.quote_requests for insert
  with check (true);

-- อ่านได้เฉพาะ authenticated (แอดมิน) — ปรับตาม role จริงภายหลัง
drop policy if exists "แอดมินอ่านใบขอราคา" on public.quote_requests;
create policy "แอดมินอ่านใบขอราคา"
  on public.quote_requests for select
  using (auth.role() = 'authenticated');

-- ข้อมูลตัวอย่าง (รันครั้งเดียว)
insert into public.material_products (
  id, name, description, category, spec, price, unit, stock, stock_status, image_url
) values
  ('cement-tiger', 'ปูนซีเมนต์ ตราลูกโลก', 'ปูนซีเมนต์ปอร์ตแลนด์ตราลูกโลก มอก.', 'ปูนและคอนกรีต', '50 กก. | มอก. 15', 178, 'ถุง', 1250, 'พร้อมส่ง', '/products/materials/cement-tiger.png'),
  ('steel-db16', 'เหล็กเส้นกลม DB16', 'เหล็กเส้นกลม SD40 สำหรับงานโครงสร้าง', 'เหล็กโครงสร้าง', 'ยาว 12 ม. | มอก.', 285, 'เส้น', 480, 'พร้อมส่ง', '/products/materials/steel-db16.png'),
  ('wood-formwork', 'ไม้แบบสน 2"x4"x4ม.', 'ไม้สนแปรรูปสำหรับงานแบบหล่อคอนกรีต', 'ไม้แบบและไม้แปรรูป', 'เกรด A', 145, 'ท่อน', 320, 'พร้อมส่ง', '/products/materials/wood-formwork.png'),
  ('metal-roof-sheet', 'เมทัลชีท หลังคา สีน้ำเงิน', 'แผ่นเมทัลชีทเคลือบสีกันสนิม', 'หลังคาและผนัง', 'หนา 0.35 มม. | ยาว 4 ม.', 185, 'แผ่น', 210, 'พร้อมส่ง', '/products/materials/metal-roof-sheet.png'),
  ('primer-paint', 'สีรองพื้นปูน TOA', 'สีรองพื้นปูนคุณภาพสูง', 'สีและเคมีภัณฑ์', 'ถัง 5 แกลลอน', 1250, 'ถัง', 45, 'เหลือน้อย', '/products/materials/primer-paint.png'),
  ('pvc-pipe', 'ท่อ PVC 4 นิ้ว (หนา)', 'ท่อ PVC ชั้น 8.5', 'ระบบประปา', 'ยาว 4 ม. | มอก.', 168, 'ท่อน', 380, 'พร้อมส่ง', '/products/materials/pvc-pipe.png'),
  ('electric-wire', 'สายไฟ VVF 2x2.5', 'สายไฟทองแดงหุ้มฉนวน', 'ระบบไฟฟ้า', 'ม้วน 100 ม. | มอก.', 1250, 'ม้วน', 28, 'เหลือน้อย', '/products/materials/electric-wire.png'),
  ('tile-adhesive', 'ปูนกาว C2TE สำหรับกระเบื้อง', 'ปูนกาวยืดหยุ่นสูง', 'สีและเคมีภัณฑ์', 'ถุง 20 กก.', 245, 'ถุง', 156, 'พร้อมส่ง', '/products/materials/tile-adhesive.png'),
  ('construction-sand', 'ทรายหยาบสำหรับงานก่อสร้าง', 'ทรายหยาบคัดเกรด', 'ปูนและคอนกรีต', 'ถุง 50 กก.', 65, 'ถุง', 800, 'พร้อมส่ง', '/products/materials/construction-sand.png'),
  ('hand-tools', 'ชุดเครื่องมือช่างมือ', 'เกรียง + ค้อน', 'เครื่องมือช่าง', 'เกรียง + ค้อน', 320, 'ชุด', 95, 'พร้อมส่ง', '/products/materials/hand-tools.png')
on conflict (id) do nothing;
