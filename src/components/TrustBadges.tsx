const BADGES = [
  { icon: '🌿', label: 'สานมือ 100%' },
  { icon: '🏅', label: 'OTOP สุรินทร์' },
  { icon: '📦', label: 'จัดส่งทั่วไทย' },
  { icon: '✅', label: 'ปลอดภัย เป็นมิตรต่อสิ่งแวดล้อม' },
] as const;

interface TrustBadgesProps {
  compact?: boolean;
}

export function TrustBadges({ compact = false }: TrustBadgesProps) {
  return (
    <ul className={`trust-badges ${compact ? 'trust-badges--compact' : ''}`} aria-label="จุดเด่นสินค้า">
      {BADGES.map(({ icon, label }) => (
        <li key={label} className="trust-badges__item">
          <span className="trust-badges__icon" aria-hidden>
            {icon}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
