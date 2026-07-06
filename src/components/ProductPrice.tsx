import { formatProductPrice, hasProductPrice, SHOW_PRICES, type Product } from '../data/products';

interface ProductPriceProps {
  product: Product;
  variant?: 'card' | 'detail' | 'featured';
}

export function ProductPrice({ product, variant = 'card' }: ProductPriceProps) {
  const showPrice = hasProductPrice(product) || (SHOW_PRICES && product.price != null);

  if (showPrice && product.price != null) {
    if (variant === 'detail') {
      return <p className="detail-body__price">{formatProductPrice(product)}</p>;
    }
    if (variant === 'featured') {
      return <p className="featured-card__price">{formatProductPrice(product)}</p>;
    }
    return <p className="product-card__price">{formatProductPrice(product)}</p>;
  }

  if (variant === 'detail') {
    return <p className="detail-body__inquire">สอบถามราคา — โทรสั่งซื้อ</p>;
  }
  if (variant === 'featured') {
    return <p className="featured-card__inquire">สอบถามราคา</p>;
  }
  return <p className="product-card__inquire">สอบถามราคา</p>;
}
