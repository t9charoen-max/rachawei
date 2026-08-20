/** ทางเข้าหน้าร้านสั่งซื้อ (ตะกร้า / PromptPay / แอดมิน) */
export function StoreEntryCard() {
  return (
    <section className="desk-entry" aria-label="ร้านสั่งซื้อราชาหวาย">
      <a className="desk-entry__card" href="/store/" target="_self" rel="noopener">
        <div className="desk-entry__glow" aria-hidden />
        <div className="desk-entry__badge">สั่งออนไลน์</div>
        <div className="desk-entry__row">
          <div className="desk-entry__icon" aria-hidden>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🛒</span>
          </div>
          <div className="desk-entry__text">
            <p className="desk-entry__kicker">ตะกร้า + พร้อมเพย์</p>
            <h2 className="desk-entry__title">ราชาหวายสุรินทร์ Store</h2>
            <p className="desk-entry__desc">
              เลือกสินค้า ใส่ตะกร้า ชำระเงิน และจัดการหลังร้านได้ทันที
            </p>
          </div>
          <span className="desk-entry__arrow" aria-hidden>
            →
          </span>
        </div>
      </a>
    </section>
  );
}
