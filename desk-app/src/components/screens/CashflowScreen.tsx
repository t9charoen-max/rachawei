import { useState } from 'react'
import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { MetricTile, ScreenHeader, SectionKicker } from '../ui'
import { CASHFLOW_HIGHLIGHTS, CASHFLOW_NOTES } from '../../lib/plan-data'
import { formatBaht, formatYearBe } from '../../lib/format'

export function CashflowScreen() {
  const [selectedYear, setSelectedYear] = useState(CASHFLOW_HIGHLIGHTS[1].year)
  const row = CASHFLOW_HIGHLIGHTS.find((r) => r.year === selectedYear) ?? CASHFLOW_HIGHLIGHTS[0]

  return (
    <div className="space-y-4">
      <ScreenHeader brand={<BrandMark />} subtitle="ไฮไลต์กระแสเงินสด · Base Case" />

      <GlassCard className="fade-up stagger-1">
        <SectionKicker>เลือกปีสำคัญ</SectionKicker>
        <div className="mt-3 flex flex-wrap gap-2">
          {CASHFLOW_HIGHLIGHTS.map((item) => (
            <button
              key={item.year}
              type="button"
              className={`pill pressable px-3.5 py-2 text-sm ${
                selectedYear === item.year ? 'pill-active' : ''
              }`}
              onClick={() => setSelectedYear(item.year)}
            >
              {formatYearBe(item.year)}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">ปี {formatYearBe(row.year)}</h2>
            <p
              className={`mt-1 text-sm font-semibold ${
                row.debtEnd === 0 ? 'text-good' : 'text-gold-soft'
              }`}
            >
              {row.status}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MetricTile label="ยอดขายวัสดุ" value={formatBaht(row.materialSales, true)} />
          <MetricTile label="รวมรายได้" value={formatBaht(row.totalRevenue, true)} />
          <MetricTile label="กำไรสุทธิ" value={formatBaht(row.netProfit, true)} />
          <MetricTile
            label="CF สุทธิปีนั้น"
            value={formatBaht(row.netCf, true)}
            tone={row.netCf >= 0 ? 'good' : 'warn'}
          />
          <MetricTile
            label="CF สะสม"
            value={formatBaht(row.cumulativeCf, true)}
            tone={row.cumulativeCf >= 0 ? 'good' : 'warn'}
          />
          <MetricTile label="หนี้คงเหลือ" value={formatBaht(row.debtEnd, true)} tone="gold" />
        </div>
      </GlassCard>

      <GlassCard className="fade-up stagger-2">
        <h3 className="text-base font-bold tracking-tight">คำอธิบายสั้น ๆ</h3>
        <ul className="mt-3 space-y-2.5">
          {CASHFLOW_NOTES.map((note) => (
            <li key={note} className="surface-raised px-3.5 py-3 text-sm leading-relaxed text-muted">
              {note}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
