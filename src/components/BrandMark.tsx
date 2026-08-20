import { SHOP_INFO } from '../data/products';

export type BrandMarkVariant = 'header' | 'hero' | 'showcase' | 'inline';

interface BrandMarkProps {
  name?: string;
  tagline?: string;
  variant?: BrandMarkVariant;
  className?: string;
  showSeal?: boolean;
}

const LOGO_SRC = '/brand/rachawei-logo-square.png';

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

export function BrandMark({
  name = SHOP_INFO.name,
  tagline,
  variant = 'header',
  className = '',
  showSeal = true,
}: BrandMarkProps) {
  const { primary, secondary } = splitShopName(name);
  const fullLabel = [primary, secondary].filter(Boolean).join(' ');

  return (
    <span
      className={`brand-mark brand-mark--${variant} ${className}`.trim()}
      title={fullLabel}
      aria-label={fullLabel}
    >
      {showSeal ? (
        <span className={`brand-mark__logo brand-mark__logo--${variant}`} aria-hidden>
          <img src={LOGO_SRC} alt="" />
        </span>
      ) : null}
      <span className="brand-mark__text">
        <span className="brand-mark__primary-wrap">
          <span className="brand-mark__primary">{primary}</span>
        </span>
        {secondary ? <span className="brand-mark__secondary">{secondary}</span> : null}
        {tagline ? <span className="brand-mark__tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
