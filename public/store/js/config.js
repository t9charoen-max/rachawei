/**
 * ราชาหวายสุรินทร์ — ตั้งค่าร้าน + สินค้าเริ่มต้น
 * แก้ไฟล์นี้แล้ว deploy ใหม่ = ทุกคนเห็นค่าเดียวกัน
 * แก้ผ่านหลังร้าน = เห็นเฉพาะเบราว์เซอร์เครื่องนั้น (IndexedDB)
 */
/* =========================================================
       ราชาหวายสุรินทร์ — เว็บถาวร (แก้ไขได้ภายหลัง)
       ---------------------------------------------------------
       วิธีที่ 1 (แนะนำสำหรับเจ้าของร้าน ทุกวัน):
         • เปิด /store/#admin → ตั้งรหัสหลังร้านครั้งแรก (เก็บในเครื่องนั้น)
         • แท็บสินค้า: เพิ่ม/แก้/ลบ/อัปโหลดรูป
         • แท็บตั้งค่า: เบอร์ บัญชี โปรโมชั่น รหัสผ่าน
         • แท็บภาพรวม: สำรองข้อมูลเข้ารหัส (ย้ายเครื่อง/สำรอง)
         ข้อมูลหลังร้านเก็บในเบราว์เซอร์เครื่องนั้น (IndexedDB)

       วิธีที่ 2 (ให้ทุกผู้เข้าชมเห็นเหมือนกันถาวร):
         • แก้ SHOP_CONFIG ในไฟล์นี้ และแคตตาล็อกที่ public/catalog/products.json
         • รัน npm run sync:store-catalog แล้ว deploy
         • หรือจากหลังร้านกด "ส่งออกสินค้าถาวร" แล้วอัปเดต products.json
         • บันทึก index.html แล้ว deploy ขึ้น Vercel ใหม่

       Deploy Vercel: อัปโหลดโฟลเดอร์ที่มี index.html + vercel.json
       ========================================================= */
    const SHOP_CONFIG = {
      shopName: 'ราชาหวายสุรินทร์',
      shopSub: 'งานหัตถกรรมจักสานหวายบ้านบุทม',
      phoneDisplay: '081-470-7089',
      phoneTel: '+66814707089',
      lineUrl: 'https://line.me/ti/p/~0814707089',
      facebookUrl: 'https://www.facebook.com/p/%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99-%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%B2%E0%B8%AB%E0%B8%A7%E0%B8%B2%E0%B8%A2%E0%B8%AA%E0%B8%B8%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A3%E0%B9%8C-100063725193085/',
      mapUrl: 'https://maps.app.goo.gl/hSA19NcULuP5KQsh6?g_st=ic',
      addressHtml: '126 หมู่ 4 บ้านบุทม<br>ต.เมืองที อ.เมือง จ.สุรินทร์ 32000<br><small style="opacity:0.85">ห่างตัวเมืองสุรินทร์ประมาณ 12 กม. ทางหลวง 226</small>',
      promoMin: 1500,
      promoDiscount: 100,
      shippingFee: 80,
      freeShippingMin: 0,
      // ข้อมูลโอนเงิน (แสดงตอนชำระเงิน)
      bankName: 'ธ.กสิกรไทย',
      bankAccountName: 'ราชาหวายสุรินทร์',
      promptPayNo: '081-470-7089',    // เบอร์/เลข พร้อมเพย์ (แสดงคำว่า "พร้อมเพย์")
      bankAccountNo: '',              // เลขบัญชีธนาคาร (แยกจากพร้อมเพย์)
      bankNote: 'โอนแล้วแนบสลิปบนเว็บได้เลย หรือส่งทาง LINE/Facebook (ไม่บังคับ)',
      // ภาพพื้นหลังฮีโร่ (เปลี่ยนได้จากหลังร้าน → แท็บตั้งค่า)
      heroImages: [
        '/images/promo/usage-shopping.png',
        '/images/promo/usage-market.png',
        '/images/promo/usage-community.png',
        '/images/promo/usage-decor.png',
        '/images/promo/usage-temple.png'
      ],
      // ภาพหน้าร้าน (แสดงในส่วนติดต่อ)
      storefrontPhotos: [
        {
          src: '/images/shop/shop-front-day.jpeg',
          alt: 'หน้าร้านราชาหวาย — ตะกร้าหวายสานมือที่หน้าร้าน',
          caption: 'หน้าร้านช่วงกลางวัน',
        },
      ]
    };

/* DEFAULT_PRODUCTS → js/catalog-products.js (generated from public/catalog/products.json) */

const DEFAULT_SHOP_VIDEOS = [
      {
        id: 1,
        title: 'ตะกร้าหวายสี่เหลี่ยม 2 ชั้น',
        videoUrl: 'https://www.youtube.com/watch?v=_6JMaYC-Zbw',
        productId: 12,
        views: 1280,
        thumbnail: ''
      },
      {
        id: 2,
        title: 'ตะกร้าหวายทรงกลมฐาน 11 นิ้ว',
        videoUrl: 'https://www.youtube.com/watch?v=AdpJCJ7TVpQ',
        productId: 2,
        views: 860,
        thumbnail: ''
      }
    ];
