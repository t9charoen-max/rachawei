import type { ReactNode } from 'react'

export function SectionKicker({ children }: { children: ReactNode }) {
  return <p className="section-kicker">{children}</p>
}

export function MetricTile({
  label,
  value,
  tone = 'sky',
  className = '',
}: {
  label: string
  value: string
  tone?: 'sky' | 'gold' | 'good' | 'warn'
  className?: string
}) {
  const valueClass =
    tone === 'gold'
      ? 'text-gold'
      : tone === 'good'
        ? 'text-good'
        : tone === 'warn'
          ? 'text-warn'
          : 'text-sky-value value-glow'

  return (
    <div className={`metric-tile ${className}`}>
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  )
}

export function ScreenHeader({
  brand,
  subtitle,
}: {
  brand: ReactNode
  subtitle: string
}) {
  return (
    <header className="fade-up px-1 pt-1">
      {brand}
      <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">{subtitle}</p>
    </header>
  )
}
