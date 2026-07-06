interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  variant?: 'card' | 'detail' | 'story';
}

export function ProductImage({ src, alt, className = '', variant = 'card' }: ProductImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`product-image product-image--${variant} ${className}`.trim()}
      loading="lazy"
      decoding="async"
    />
  );
}
