import { STORE_URL } from '../../lib/storeUrl';

/** Legacy card — unused on current landing; keep aligned with /store/ entry only */
export function StoreEntryCard() {
  return (
    <section className="desk-entry" aria-label="ร้านสั่งซื้อราชาหวาย">
      <a className="desk-entry__card" href={STORE_URL} target="_self" rel="noopener">
        <div className="desk-entry__glow" aria-hidden />
        <div className="desk-entry__badge">สั่งออนไลน์</div>
        <div className="desk-entry__row">
          <div className="desk-entry__icon" aria-hidden>
            <img
              src="/brand/rachawei-logo-square.png"
              alt=""
              width={48}
              height={48}
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '0.65rem' }}
            />
          </div>
          <div className="desk-entry__text">
            <p className="desk-entry__kicker">ตะกร้า + พร้อมเพย์</p>
            <h2 className="desk-entry__title">ราชาหวายสุรินทร์ Store</h2>
            <p className="desk-entry__desc">
              เลือกสินค้า ใส่ตะกร้า และชำระเงินได้ทันที
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
