import { useId } from 'react';

interface EcoHandmadeBadgeProps {
  variant?: 'card' | 'featured';
  className?: string;
}

function LeafIcon({ gradientId }: { gradientId: string }) {
  return (
    <svg
      className="eco-badge__icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 21s-6.5-4.8-6.5-10.2C5.5 7.1 8.4 3 12 3s6.5 4.1 6.5 7.8C18.5 16.2 12 21 12 21Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M12 5.5v12.5M9 9.5c1.5-.9 3-.9 6 0M9.5 12.5c1.2-.7 2.3-.7 5 0"
        stroke="rgba(240,253,244,0.65)"
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="7" y1="4" x2="17" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dcfce7" />
          <stop offset="0.55" stopColor="#86efac" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EcoHandmadeBadge({ variant = 'card', className = '' }: EcoHandmadeBadgeProps) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <span
      className={`eco-badge eco-badge--${variant} ${className}`.trim()}
      title="สานมือ 100% ปลอดภัย เป็นมิตรต่อสิ่งแวดล้อม"
      aria-label="สานมือ 100% ปลอดภัย เป็นมิตรต่อสิ่งแวดล้อม"
    >
      <LeafIcon gradientId={gradientId} />
      <span className="eco-badge__text">สานมือ 100%</span>
    </span>
  );
}
