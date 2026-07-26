import { useEffect, useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'auto' | 'sync';
}

/** Image that shows a calm placeholder instead of a broken icon when load fails. */
export function SafeImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return <div className={`safe-image-fallback ${className}`.trim()} role="img" aria-label={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
    />
  );
}
