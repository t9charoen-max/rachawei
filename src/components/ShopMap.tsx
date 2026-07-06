import { MAP_CONFIG } from '../data/shop';
import { SHOP_INFO } from '../data/products';

export function ShopMap() {
  return (
    <section className="shop-map">
      <h2 className="section-title">แผนที่มาร้าน</h2>
      <p className="shop-map__address">{SHOP_INFO.location}</p>

      <div className="shop-map__frame">
        <iframe
          title="แผนที่ร้านราชาหวายสุรินทร์"
          src={MAP_CONFIG.embedUrl}
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <a
        href={MAP_CONFIG.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn--primary btn--full"
      >
        นำทางด้วย Google Maps
      </a>
    </section>
  );
}
