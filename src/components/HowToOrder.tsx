const STEPS = [
  { step: '1', title: 'เลือกสินค้า', desc: 'แตะดูรูปและรายละเอียด' },
  { step: '2', title: 'กรอกฟอร์ม', desc: 'ชื่อ เบอร์ จำนวน ที่อยู่' },
  { step: '3', title: 'ส่งทาง LINE', desc: 'ร้านยืนยันราคาและจัดส่ง' },
] as const;

export function HowToOrder() {
  return (
    <section className="how-to-order" aria-label="วิธีสั่งซื้อ">
      <h3 className="how-to-order__title">สั่งซื้อง่าย 3 ขั้นตอน</h3>
      <ol className="how-to-order__list">
        {STEPS.map(({ step, title, desc }) => (
          <li key={step} className="how-to-order__item">
            <span className="how-to-order__step">{step}</span>
            <div>
              <strong>{title}</strong>
              <p>{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
