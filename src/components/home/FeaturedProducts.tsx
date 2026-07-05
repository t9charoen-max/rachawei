import type { Product } from '../../data/products';
import { SHOW_PRICES } from '../../data/products';

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

      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featured.map((product, i) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className="group w-[68%] shrink-0 overflow-hidden rounded-2xl border border-gold-400/10 bg-earth-800/50 text-left transition hover:border-gold-400/30 hover:glow-gold sm:w-[45%]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-950/80 via-transparent to-transparent" />
              <span className="absolute top-3 left-3 rounded-full bg-earth-950/70 px-2.5 py-0.5 text-[0.65rem] font-medium text-gold-300 backdrop-blur-sm">
                {product.category}
              </span>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cream-50">
                {product.name}
              </h3>
              {SHOW_PRICES && product.price != null ? (
                <p className="mt-2 text-base font-bold text-gold-400">
                  ฿{product.price.toLocaleString('th-TH')}
                </p>
              ) : (
                <p className="mt-2 text-sm text-cream-300/70">สอบถามราคา</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
