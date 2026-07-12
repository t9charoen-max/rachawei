const STEPS = [
  { step: '1', title: 'เลือกสินค้า', desc: 'แตะดูรูปและรายละเอียด' },
  { step: '2', title: 'โทร / LINE', desc: 'สแกนเพิ่มเพื่อนสอบถาม' },
  { step: '3', title: 'รับสินค้า', desc: 'แพ็กอย่างดี ส่งถึงมือ' },
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
