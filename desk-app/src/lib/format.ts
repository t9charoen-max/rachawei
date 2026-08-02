export function formatBaht(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '฿0'
  if (compact) {
    const abs = Math.abs(value)
    if (abs >= 1_000_000) {
      const mil = value / 1_000_000
      return `฿${mil.toLocaleString('th-TH', { maximumFractionDigits: 1 })} ล้าน`
    }
    if (abs >= 1_000) {
      return `฿${(value / 1_000).toLocaleString('th-TH', { maximumFractionDigits: 0 })}k`
    }
  }
  return `฿${Math.round(value).toLocaleString('th-TH')}`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString('th-TH', { maximumFractionDigits: digits })}%`
}

export function formatYearBe(yearCe: number): string {
  return String(yearCe + 543)
}
