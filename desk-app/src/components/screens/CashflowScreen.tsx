import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { CASHFLOW_HIGHLIGHTS, CASHFLOW_NOTES } from '../../lib/plan-data'
import { formatBaht, formatYearBe } from '../../lib/format'
import { useState } from 'react'

export function CashflowScreen() {
  const [selectedYear, setSelectedYear] = useState(CASHFLOW_HIGHLIGHTS[1].year)
  const row = CASHFLOW_HIGHLIGHTS.find((r) => r.year === selectedYear) ?? CASHFLOW_HIGHLIGHTS[0]

  return (
    <div className="space-y-4">
      <header className="fade-up px-1 pt-1">
        <BrandMark />
        <p className="mt-1 text-sm text-muted">ไฮไลต์กระแสเงินสด · Base Case</p>
      </header>

      <GlassCard className="fade-up stagger-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft">
          เลือกปีสำคัญ
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CASHFLOW_HIGHLIGHTS.map((item) => (
            <button
              key={item.year}
              type="button"
              className={`pill pressable px-3 py-2 text-sm ${
                selectedYear === item.year ? 'pill-active' : ''
              }`}
              onClick={() => setSelectedYear(item.year)}
            >
              {formatYearBe(item.year)}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-xl font-bold">ปี {formatYearBe(row.year)}</h2>
        <p
          className={`mt-1 text-sm font-semibold ${
            row.debtEnd === 0 ? 'text-emerald-400' : 'text-gold-soft'
          }`}
        >
          {row.status}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Stat label="ยอดขายวัสดุ" value={formatBaht(row.materialSales, true)} />
          <Stat label="รวมรายได้" value={formatBaht(row.totalRevenue, true)} />
          <Stat label="กำไรสุทธิ" value={formatBaht(row.netProfit, true)} />
          <Stat
            label="CF สุทธิปีนั้น"
            value={formatBaht(row.netCf, true)}
            tone={row.netCf >= 0 ? 'good' : 'warn'}
          />
          <Stat
            label="CF สะสม"
            value={formatBaht(row.cumulativeCf, true)}
            tone={row.cumulativeCf >= 0 ? 'good' : 'warn'}
          />
          <Stat label="หนี้คงเหลือ" value={formatBaht(row.debtEnd, true)} />
        </div>
      </GlassCard>

      <GlassCard className="fade-up stagger-2">
        <h3 className="text-base font-bold">คำอธิบายสั้น ๆ</h3>
        <ul className="mt-3 space-y-2.5">
          {CASHFLOW_NOTES.map((note) => (
            <li
              key={note}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-muted"
            >
              {note}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'good' | 'warn'
}) {
  const valueClass =
    tone === 'good'
      ? 'text-emerald-400'
      : tone === 'warn'
        ? 'text-rose-300'
        : 'text-sky-value'

  return (
    <div className="rounded-xl bg-black/20 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}
