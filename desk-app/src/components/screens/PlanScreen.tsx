import { BrandMark } from '../BrandMark'
import { GlassCard } from '../GlassCard'
import { MetricTile, ScreenHeader, SectionKicker } from '../ui'
import { BRAND, KEY_METRICS, PHASES } from '../../lib/plan-data'
import { formatBaht } from '../../lib/format'
import type { TabId } from '../../App'

export function PlanScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <ScreenHeader
        brand={<BrandMark size="lg" />}
        subtitle={BRAND.principle}
      />

      <GlassCard className="fade-up stagger-1">
        <SectionKicker>เส้นทาง 5 เฟส</SectionKicker>
        <h1 className="mt-1.5 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
          แผนการเงินส่วนตัว ตามระบบ
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{BRAND.tagline}</p>

        <div className="relative mt-5 space-y-2.5">
          <div
            aria-hidden
            className="absolute top-4 bottom-4 left-[1.45rem] w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent"
          />
          {PHASES.map((phase, index) => (
            <div
              key={phase.id}
              className="surface-raised relative flex gap-3 px-3 py-3"
              style={{ animationDelay: `${80 + index * 40}ms` }}
            >
              <div className="phase-node relative z-10 shrink-0">{index}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold tracking-tight">{phase.name}</p>
                  <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold-soft">
                    {phase.budgetLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-muted-dim">{phase.period}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{phase.summary}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {KEY_METRICS.slice(0, 4).map((item) => (
            <MetricTile
              key={item.label}
              label={item.label}
              value={item.value != null ? formatBaht(item.value, true) : (item.valueLabel ?? '')}
            />
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

      <p className="fade-up stagger-2 px-1 pb-1 text-center text-[11px] text-muted-dim">
        สรุปจากแบบจำลอง Excel · {BRAND.updatedAt} · ปรับตัวเลขได้ตามสถานการณ์จริง
      </p>
    </div>
  )
}
