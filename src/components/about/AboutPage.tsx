import { SHOP_INFO } from '../../data/products';
import { BanthomKnowledgeSection } from './BanthomKnowledgeSection';

interface AboutPageProps {
  coverImage?: string;
  coverImageAlt?: string;
  onOpenAdmin?: () => void;
}

export function AboutPage({ coverImage, coverImageAlt, onOpenAdmin }: AboutPageProps) {
  return (
    <section className="screen about-screen py-4">
      <h2 className="section-title">เกี่ยวกับเรา</h2>

      <div className="about-card">
        <img
          src={coverImage || SHOP_INFO.heroImage}
          alt={coverImageAlt || 'ช่างสานหวายราชาหวายสุรินทร์'}
          className="about-card__image"
        />
        <p>{SHOP_INFO.story}</p>
      </div>

      {onOpenAdmin && (
        <button type="button" className="admin-entry-card" onClick={onOpenAdmin}>
          <span className="admin-entry-card__icon" aria-hidden>
            ⚙️
          </span>
          <span>
            <strong>จัดการหลังร้าน</strong>
            <span>แก้ภาพหน้าปก · เพิ่มสินค้า · แก้รูป</span>
          </span>
        </button>
      )}

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
