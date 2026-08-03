/** ทางเข้าถาวรไปยังแอปแผนการเงิน ราชาวัสดุ Desk */
export function DeskEntryCard() {
  return (
    <section className="desk-entry" aria-label="ราชาวัสดุ Desk">
      <a className="desk-entry__card" href="/desk/" target="_self" rel="noopener">
        <div className="desk-entry__glow" aria-hidden />
        <div className="desk-entry__badge">ถาวรบนหน้าจอโฮม</div>
        <div className="desk-entry__row">
          <div className="desk-entry__icon" aria-hidden>
            <img src="/desk/icons/icon-192.png" alt="" width={48} height={48} />
          </div>
          <div className="desk-entry__text">
            <p className="desk-entry__kicker">แผนการเงิน</p>
            <h2 className="desk-entry__title">ราชาวัสดุ Desk</h2>
            <p className="desk-entry__desc">
              เปิดแผน 5 เฟส · จำลองทุน · กระแสเงินสด — ติดตั้งลงหน้าจอโฮมได้ ไม่หาย
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
