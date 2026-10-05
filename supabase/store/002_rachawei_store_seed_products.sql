-- =============================================================================
-- Rachawei-store — seed products from public/catalog/products.json
-- Project target: Rachawei-store (ONLY)
--
-- DO NOT RUN until schema (001) is approved and applied.
-- Uses upsert by id — will NOT delete existing rows; only inserts/updates listed ids.
-- Image paths are filenames as in catalog (app resolves under /products/).
-- featured maps from catalog field "special".
-- =============================================================================

insert into public.store_products (
  id, name, description, price, images, category, store_cat, stock,
  emoji, badge, featured, size, panorama360, status, sort_order
) values
  ('1', 'ตะกร้าหวายทรงกลมปากหยัก', 'ตะกร้าหวายทรงกลมปากหยัก หูจับสูง ลายสานถี่ งานประณีตจากช่างบ้านบุทม', 350, '["basket-01-round-scalloped.jpg"]'::jsonb, 'หูจับสูง', 'basket', 15, '🧺', null, false, null, 'basket-01-360.jpg', 'active', 1),
  ('2', 'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว', 'ตะกร้าหวายทรงกลม ฐาน 11 นิ้ว หูจับมั่นคง สานมือ 100%', 280, '["basket-02-round-11inch.jpg"]'::jsonb, 'ทรงกลม', 'basket', 25, '🧺', null, false, null, 'basket-02-360.jpg', 'active', 2),
  ('3', 'ตะกร้าหวายมีฝา ชุดคู่', 'ตะกร้าหวายมีฝาปิด ชุดคู่ ลายสานละเอียด เหมาะเป็นของฝาก', 520, '["basket-03-lidded-pair.jpg"]'::jsonb, 'มีฝา', 'basket', 10, '🎁', 'ของขวัญ', false, null, 'basket-03-360.jpg', 'active', 3),
  ('4', 'ตะกร้าหวายทรงเหลี่ยมมีฝา', 'ตะกร้าหวายทรงเหลี่ยมมีฝา หูจับมั่นคง ลายสานโปร่งตรงกลาง วางซ้อนได้สะดวก', 480, '["basket-04-rectangular-lid.jpg"]'::jsonb, 'ทรงเหลี่ยม', 'basket', 3, '🧺', null, false, null, 'basket-04-360.jpg', 'active', 4),
  ('5', 'ตะกร้าหวายหลายแบบ', 'ตะกร้าหวายหลากหลายทรง ทั้งกลม เหลี่ยม และปากหยัก จากราชาหวายสุรินทร์', 590, '["basket-05-collection.jpg"]'::jsonb, 'ทรงกลม', 'basket', 8, '🧺', null, false, null, 'basket-05-360.jpg', 'active', 5),
  ('6', 'ตะกร้าหวาย 8 เหลี่ยม ชั้นเดียว', 'ตะกร้าหวายทรงแปดเหลี่ยม ชั้นเดียว หูจับสูง ลายสานเนี้ยบ งานพิเศษจากช่างฝีมือบ้านบุทม สวยงามทนทาน ใช้ได้หลากหลาย', 650, '["basket-06-octagonal-single.jpg"]'::jsonb, 'พิเศษ', 'basket', 0, '🧺', 'พิเศษ', true, null, null, 'active', 6),
  ('7', 'ตะกร้าหวาย 8 เหลี่ยม 2 ชั้น', 'ตะกร้าหวายทรงแปดเหลี่ยม 2 ชั้น หูจับสูง ลายสานโปร่ง งานพิเศษจากช่างฝีมือบ้านบุทม เหมาะใช้งานและตกแต่งบ้าน', 720, '["basket-07-octagonal-lifestyle.jpg"]'::jsonb, 'พิเศษ', 'basket', 5, '🧺', 'พิเศษ', true, null, null, 'active', 7),
  ('8', 'ตะกร้ากลม 2 ชั้น ถักปาก', 'ตะกร้าหวายทรงกลม 2 ชั้น ปากถักตกแต่ง หูจับสูง งานสานมือจากช่างฝีมือบ้านบุทม เหมาะถวายทำบุญและใช้งานทั่วไป', 420, '["basket-08-round-studio.jpg","basket-08-round-temple.jpg","basket-08-round-grass.jpg"]'::jsonb, 'ทรงกลม', 'basket', 20, '🧺', null, false, null, null, 'active', 8),
  ('9', 'ตะกร้าหวายรีเหลี่ยม 2 ชั้น พิเศษ', 'ตะกร้าหวายทรงรีเหลี่ยม 2 ชั้น ปากหยัก หูจับสูง ลายสานโปร่ง งานพิเศษสานมือจากช่างฝีมือบ้านบุทม เหมาะใส่ผลไม้ ของใช้ และตกแต่งบ้าน', 750, '["basket-09-oval-community.jpg","basket-09-oval-lifestyle.jpg","basket-09-oval-topdown.jpg"]'::jsonb, 'พิเศษ', 'basket', 8, '🧺', 'พิเศษ', true, null, null, 'active', 9),
  ('10', 'เก้าอี้หวาย', 'เก้าอี้หวายสานมือ พร้อมโต๊ะหวาย ดีไซน์โค้งมน นั่งสบาย เหมาะมุมนั่งเล่น มุมสวน และพื้นที่พักผ่อน งานช่างฝีมือบ้านบุทม', 3800, '["chair-10-garden-set-1.jpg","chair-10-garden-set-2.jpg"]'::jsonb, 'เก้าอี้', 'chair', 6, '🪑', null, false, null, null, 'active', 10),
  ('11', 'เก้าอี้หวาย ทรงกลม', 'เก้าอี้หวายทรงกลมสานมือ ชุดคู่พร้อมโต๊ะหวาย ดีไซน์หลังมน นั่งสบาย เหมาะมุมระเบียง มุมนั่งเล่น และพื้นที่พักผ่อน งานช่างฝีมือบ้านบุทม', 4500, '["chair-11-patio-set.jpg"]'::jsonb, 'เก้าอี้', 'chair', 4, '🪑', null, false, null, null, 'active', 11),
  ('12', 'ตะกร้าหวายสี่เหลี่ยมจัตุรัส 2 ชั้น', 'ตะกร้าหวายทรงสี่เหลี่ยมจัตุรัส 2 ชั้น หูจับสูง ลายสานโปร่ง งานพิเศษสานมือจากช่างฝีมือบ้านบุทม เหมาะใส่ของใช้ ผลไม้ และตกแต่งบ้าน', 890, '["basket-12-square-lifestyle.jpg","basket-12-square-usage.jpg","basket-12-square-topdown.jpg"]'::jsonb, 'พิเศษ', 'basket', 12, '🧺', 'ยอดนิยม', true, 'กว้าง 30×30×35 ซม.', null, 'active', 12)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  images = excluded.images,
  category = excluded.category,
  store_cat = excluded.store_cat,
  stock = excluded.stock,
  emoji = excluded.emoji,
  badge = excluded.badge,
  featured = excluded.featured,
  size = excluded.size,
  panorama360 = excluded.panorama360,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Default shop settings row (contact/payment from artifacts/js/config.js)
-- content JSON left as {} — filled later from DEFAULT_STORE_CONTENT / Admin CMS
insert into public.store_shop_settings (
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
  order_seq
) values (
  'default',
  'ราชาหวายสุรินทร์',
  'งานหัตถกรรมจักสานหวายบ้านบุทม',
  '081-470-7089',
  '+66814707089',
  'https://line.me/ti/p/~0814707089',
  'https://www.facebook.com/p/%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99-%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%B2%E0%B8%AB%E0%B8%A7%E0%B8%B2%E0%B8%A2%E0%B8%AA%E0%B8%B8%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A3%E0%B9%8C-100063725193085/',
  'https://maps.app.goo.gl/hSA19NcULuP5KQsh6?g_st=ic',
  '126 หมู่ 4 บ้านบุทม<br>ต.เมืองที อ.เมือง จ.สุรินทร์ 32000<br><small style="opacity:0.85">ห่างตัวเมืองสุรินทร์ประมาณ 12 กม. ทางหลวง 226</small>',
  1500,
  100,
  80,
  0,
  'ธ.กสิกรไทย',
  'ราชาหวายสุรินทร์',
  '081-470-7089',
  '',
  'โอนแล้วแนบสลิปบนเว็บได้เลย หรือส่งทาง LINE/Facebook (ไม่บังคับ)',
  '["/images/promo/usage-shopping.png","/images/promo/usage-market.png","/images/promo/usage-community.png","/images/promo/usage-decor.png","/images/promo/usage-temple.png"]'::jsonb,
  '[{"src":"/images/shop/shop-front-day.jpeg","alt":"หน้าร้านราชาหวาย — ตะกร้าหวายสานมือที่หน้าร้าน","caption":"หน้าร้านช่วงกลางวัน"}]'::jsonb,
  '{}'::jsonb,
  1
)
on conflict (id) do update set
  shop_name = excluded.shop_name,
  shop_sub = excluded.shop_sub,
  phone_display = excluded.phone_display,
  phone_tel = excluded.phone_tel,
  line_url = excluded.line_url,
  facebook_url = excluded.facebook_url,
  map_url = excluded.map_url,
  address_html = excluded.address_html,
  promo_min = excluded.promo_min,
  promo_discount = excluded.promo_discount,
  shipping_fee = excluded.shipping_fee,
  free_shipping_min = excluded.free_shipping_min,
  bank_name = excluded.bank_name,
  bank_account_name = excluded.bank_account_name,
  promptpay_no = excluded.promptpay_no,
  bank_note = excluded.bank_note,
  hero_images = excluded.hero_images,
  storefront_photos = excluded.storefront_photos,
  updated_at = now();
-- Note: on conflict we intentionally do NOT overwrite content or admin_pin_hash
-- if they were already customized (content only updated when still empty is left to app layer).
