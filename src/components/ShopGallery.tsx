import { SHOP_PHOTOS } from '../data/shop';

export function ShopGallery() {
  return (
    <section className="shop-gallery">
      <h2 className="section-title">ภายในร้าน</h2>
      <div className="shop-gallery__grid">
        {SHOP_PHOTOS.map((photo) => (
          <figure key={photo.id} className="shop-gallery__item">
            <img src={photo.src} alt={photo.alt} loading="lazy" />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
