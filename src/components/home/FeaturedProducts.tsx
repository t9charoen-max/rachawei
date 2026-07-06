import type { Product } from '../../data/products';
import { ProductPrice } from '../ProductPrice';

interface FeaturedProductsProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onViewAll: () => void;
}

export function FeaturedProducts({ products, onSelect, onViewAll }: FeaturedProductsProps) {
  const featured = products.slice(0, 3);

  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">สินค้าแนะนำ</p>
          <h2 className="font-display mt-1 text-xl font-bold text-cream-50">ตะกร้าหวาย</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-gold-400 transition hover:text-gold-300"
        >
          ดูทั้งหมด →
        </button>
      </div>

      <div className="featured-scroll">
        {featured.map((product, i) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className="featured-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="featured-card__image">
              <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
              <span className="featured-card__badge">{product.category}</span>
              <span className="featured-card__tag">สานมือ OTOP</span>
            </div>
            <div className="featured-card__body">
              <h3 className="featured-card__name">{product.name}</h3>
              <ProductPrice product={product} variant="featured" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
