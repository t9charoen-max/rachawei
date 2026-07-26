import { useId } from 'react';
import { SHOP_INFO } from '../data/products';

export type BrandMarkVariant = 'header' | 'hero' | 'showcase' | 'inline';

interface BrandMarkProps {
  name?: string;
  tagline?: string;
  variant?: BrandMarkVariant;
  className?: string;
  showSeal?: boolean;
}

/** แยก “ราชาหวาย” เป็นชื่อหลัก และ “สุรินทร์” เป็นรอง — รองรับชื่อที่แก้จากหลังบ้าน */
export function splitShopName(name: string): { primary: string; secondary: string } {
  const trimmed = name.trim() || SHOP_INFO.name;
  const match = trimmed.match(/^(ราชาหวาย)\s*(.*)$/);
  if (match) {
    return {
      primary: match[1],
      secondary: (match[2] || 'สุรินทร์').trim(),
    };
  }
  return { primary: trimmed, secondary: '' };
}

function BrandSeal({ variant, gradId }: { variant: BrandMarkVariant; gradId: string }) {
  const size = variant === 'header' ? 40 : variant === 'hero' ? 36 : 28;
  return (
    <span className={`brand-mark__seal brand-mark__seal--${variant}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18.5" stroke={`url(#${gradId}-stroke)`} strokeWidth="1.4" opacity="0.85" />
        <circle cx="20" cy="20" r="15.2" stroke={`url(#${gradId}-stroke)`} strokeWidth="0.7" opacity="0.35" />
        <path
          d="M10.5 24.5h19l-1.4-8.2-4.3 3.4L20 12.8l-3.8 6.9-4.3-3.4L10.5 24.5Z"
          fill={`url(#${gradId}-fill)`}
          stroke={`url(#${gradId}-stroke)`}
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 26.2h14M14.2 27.6h11.6"
          stroke={`url(#${gradId}-stroke)`}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.75"
        />
        <defs>
          <linearGradient id={`${gradId}-stroke`} x1="8" y1="8" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f7e7b0" />
            <stop offset="0.45" stopColor="#d4a853" />
            <stop offset="1" stopColor="#8a6424" />
          </linearGradient>
          <linearGradient id={`${gradId}-fill`} x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0d78c" />
            <stop offset="0.55" stopColor="#c9a227" />
            <stop offset="1" stopColor="#7a5620" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export function BrandMark({
  name = SHOP_INFO.name,
  tagline,
  variant = 'header',
  className = '',
  showSeal = true,
}: BrandMarkProps) {
  const gradId = useId().replace(/:/g, '');
  const { primary, secondary } = splitShopName(name);

  return (
    <span className={`brand-mark brand-mark--${variant} ${className}`.trim()}>
      {showSeal && <BrandSeal variant={variant} gradId={gradId} />}
      <span className="brand-mark__text">
        {/* wrap แยก filter ออกจาก background-clip — กัน iOS กลายเป็นกล่องทึบ */}
        <span className="brand-mark__primary-wrap">
          <span className="brand-mark__primary">{primary}</span>
        </span>
        {secondary ? <span className="brand-mark__secondary">{secondary}</span> : null}
        {tagline ? <span className="brand-mark__tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
