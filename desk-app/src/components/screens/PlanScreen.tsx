import { BrandMark } from '../BrandMark'
import { GlassCard } from '../GlassCard'
import { BRAND, KEY_METRICS, PHASES } from '../../lib/plan-data'
import { formatBaht } from '../../lib/format'
import type { TabId } from '../../App'

export function PlanScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <header className="fade-up px-1 pt-1">
        <BrandMark size="lg" />
        <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted">
          {BRAND.principle}
        </p>
      </header>

      <GlassCard className="fade-up stagger-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft">
          เส้นทาง 5 เฟส
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
          แผนการเงินส่วนตัว ตามระบบ
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {BRAND.tagline}
        </p>

        <div className="mt-4 space-y-2.5">
          {PHASES.map((phase, index) => (
            <div
              key={phase.id}
              className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                {index}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{phase.name}</p>
                  <span className="shrink-0 text-[11px] font-medium text-gold-soft">
                    {phase.budgetLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-dim">{phase.period}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{phase.summary}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {KEY_METRICS.slice(0, 4).map((item) => (
            <div key={item.label} className="rounded-xl bg-black/20 px-3 py-2.5">
              <p className="text-[11px] text-muted">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-sky-value">
                {item.value != null ? formatBaht(item.value, true) : item.valueLabel}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-gold pressable mt-5 h-12 w-full text-[15px]"
          onClick={() => onNavigate('capital')}
        >
          จำลองทุนและยอดขาย
        </button>
        <button
          type="button"
          className="btn-ghost pressable mt-2.5 h-12 w-full text-[15px] font-semibold"
          onClick={() => onNavigate('cashflow')}
        >
          ดูไฮไลต์กระแสเงินสด
        </button>
      </GlassCard>

      <p className="fade-up stagger-2 px-1 text-center text-[11px] text-muted-dim">
        สรุปจากแบบจำลอง Excel · {BRAND.updatedAt} · ปรับตัวเลขได้ตามสถานการณ์จริง
      </p>
    </div>
  )
}
