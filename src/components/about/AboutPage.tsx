import { SHOP_INFO } from '../../data/products';
import { BanthomKnowledgeSection } from './BanthomKnowledgeSection';

export function AboutPage() {
  return (
    <section className="screen about-screen py-4">
      <h2 className="section-title">เกี่ยวกับเรา</h2>

      <div className="about-card">
        <img
          src={SHOP_INFO.heroImage}
          alt="ช่างสานหวายราชาหวายสุรินทร์"
          className="about-card__image"
        />
        <p>{SHOP_INFO.story}</p>
      </div>

      <ul className="about-list">
        <li>
          <strong>ที่ตั้ง</strong>
          <span>{SHOP_INFO.location}</span>
        </li>
        <li>
          <strong>เวลาทำการ</strong>
          <span>{SHOP_INFO.hours}</span>
        </li>
        <li>
          <strong>โทรศัพท์</strong>
          <span>{SHOP_INFO.phone}</span>
        </li>
      </ul>

      <BanthomKnowledgeSection />
    </section>
  );
}
