import { useState } from 'react'
import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { SCENARIOS, type ScenarioId } from '../../lib/plan-data'
import { formatBaht, formatPercent } from '../../lib/format'

export function ScenarioScreen() {
  const [active, setActive] = useState<ScenarioId>('base')
  const scenario = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0]

  return (
    <div className="space-y-4">
      <header className="fade-up px-1 pt-1">
        <BrandMark />
        <p className="mt-1 text-sm text-muted">เปรียบเทียบ 3 กรณี</p>
      </header>

      <GlassCard className="fade-up stagger-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft">
          เลือกสถานการณ์
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pill pressable px-2 py-2.5 text-sm ${
                active === item.id ? 'pill-active' : ''
              }`}
              onClick={() => setActive(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-xl font-bold">{scenario.name} Case</h2>
        <p className="mt-1 text-sm text-muted">
          สมมติฐานหลักที่ขับเคลื่อนผลลัพธ์ของแผน
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Metric label="ยอดขายเดือนแรก" value={formatBaht(scenario.firstMonthSales)} />
          <Metric label="Gross Margin" value={formatPercent(scenario.grossMargin, 0)} />
          <Metric label="เติบโตปีแรก ๆ" value={formatPercent(scenario.earlyGrowth, 0)} />
          <Metric label="ปีที่หนี้หมด" value={scenario.debtFreeYears} accent />
          <Metric label="CF สะสมปีที่ 10" value={scenario.cfYear10} accent className="col-span-2" />
        </div>
      </GlassCard>

      <GlassCard className="fade-up stagger-2 overflow-x-auto">
        <h3 className="text-base font-bold">ตารางเปรียบเทียบ</h3>
        <table className="mt-3 w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[11px] text-muted">
              <th className="pb-2 font-medium">ตัวแปร</th>
              {SCENARIOS.map((s) => (
                <th key={s.id} className="pb-2 font-medium">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[13px]">
            <CompareRow
              label="ยอดขายเดือนแรก"
              values={SCENARIOS.map((s) => formatBaht(s.firstMonthSales, true))}
              activeIndex={SCENARIOS.findIndex((s) => s.id === active)}
            />
            <CompareRow
              label="Gross Margin"
              values={SCENARIOS.map((s) => formatPercent(s.grossMargin, 0))}
              activeIndex={SCENARIOS.findIndex((s) => s.id === active)}
            />
            <CompareRow
              label="เติบโตปีแรก ๆ"
              values={SCENARIOS.map((s) => formatPercent(s.earlyGrowth, 0))}
              activeIndex={SCENARIOS.findIndex((s) => s.id === active)}
            />
            <CompareRow
              label="ปีที่หนี้หมด"
              values={SCENARIOS.map((s) => s.debtFreeYears)}
              activeIndex={SCENARIOS.findIndex((s) => s.id === active)}
            />
            <CompareRow
              label="CF ปีที่ 10"
              values={SCENARIOS.map((s) => s.cfYear10)}
              activeIndex={SCENARIOS.findIndex((s) => s.id === active)}
            />
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}

function Metric({
  label,
  value,
  accent = false,
  className = '',
}: {
  label: string
  value: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-black/20 px-3 py-2.5 ${className}`}>
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${accent ? 'text-gold' : 'text-sky-value'}`}>
        {value}
      </p>
    </div>
  )
}

function CompareRow({
  label,
  values,
  activeIndex,
}: {
  label: string
  values: string[]
  activeIndex: number
}) {
  return (
    <tr className="border-t border-white/8">
      <td className="py-2.5 pr-2 text-muted">{label}</td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={`py-2.5 font-semibold ${
            index === activeIndex ? 'text-gold' : 'text-ink/90'
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  )
}
