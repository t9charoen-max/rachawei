import type { Product } from '../../data/products';
import { getProductDisplayCategory } from '../../data/products';
import { STORE_URL, storeProductUrl } from '../../lib/storeUrl';
import { ProductImageBadges } from '../ProductImageBadges';
import { ProductImageFrame } from '../ProductImageFrame';

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const featured = products.slice(0, 3);

  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">สินค้าแนะนำ</p>
          <h2 className="font-display mt-1 text-xl font-bold text-cream-50">ตะกร้าหวาย</h2>
        </div>
        <a
          href={STORE_URL}
          className="text-sm font-medium text-gold-400 transition hover:text-gold-300"
        >
          ดูทั้งหมด →
        </a>
      </div>

      <div className="featured-scroll">
        {featured.map((product, i) => {
          const categoryLabel = getProductDisplayCategory(product);
          return (
          <a
            key={product.id}
            href={storeProductUrl(product.id)}
            className="featured-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="featured-card__image">
              <ProductImageFrame variant="featured">
                <img src={product.image} alt={product.name} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                <ProductImageBadges />
              </ProductImageFrame>
            </div>
            <div className="featured-card__body">
              {categoryLabel ? (
                <span className="featured-card__category">{categoryLabel}</span>
              ) : null}
              <h3 className="featured-card__name">{product.name}</h3>
            </div>
          </a>
          );
        })}
      </div>
    </section>
  );
}
