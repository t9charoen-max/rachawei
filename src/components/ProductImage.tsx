interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`product-image ${className}`.trim()}
      loading="lazy"
      decoding="async"
    />
  );
}
