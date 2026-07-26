import { BanthomKnowledgeSection } from './BanthomKnowledgeSection';

interface AboutPageProps {
  image?: string;
  imageAlt?: string;
  story?: string;
  location?: string;
  hours?: string;
  phone?: string;
}

export function AboutPage({
  image,
  imageAlt,
  story,
  location,
  hours,
  phone,
}: AboutPageProps) {
  return (
    <section className="screen about-screen py-4">
      <h2 className="section-title">เกี่ยวกับเรา</h2>

      <div className="about-card">
        {image ? (
          <img src={image} alt={imageAlt || 'เกี่ยวกับร้าน'} className="about-card__image" />
        ) : null}
        {story ? <p>{story}</p> : null}
      </div>

      <ul className="about-list">
        {location ? (
          <li>
            <strong>ที่ตั้ง</strong>
            <span>{location}</span>
          </li>
        ) : null}
        {hours ? (
          <li>
            <strong>เวลาทำการ</strong>
            <span>{hours}</span>
          </li>
        ) : null}
        {phone ? (
          <li>
            <strong>โทรศัพท์</strong>
            <span>{phone}</span>
          </li>
        ) : null}
      </ul>

      <BanthomKnowledgeSection />
    </section>
  );
}
