import { useState } from 'react'
import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { MetricTile, ScreenHeader, SectionKicker } from '../ui'
import { SCENARIOS, type ScenarioId } from '../../lib/plan-data'
import { formatBaht, formatPercent } from '../../lib/format'

export function ScenarioScreen() {
  const [active, setActive] = useState<ScenarioId>('base')
  const scenario = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0]
  const activeIndex = SCENARIOS.findIndex((s) => s.id === active)

  return (
    <div className="space-y-4">
      <ScreenHeader brand={<BrandMark />} subtitle="เปรียบเทียบ 3 กรณี" />

      <GlassCard className="fade-up stagger-1">
        <SectionKicker>เลือกสถานการณ์</SectionKicker>
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

        <h2 className="mt-5 text-xl font-bold tracking-tight">{scenario.name} Case</h2>
        <p className="mt-1 text-sm text-muted">สมมติฐานหลักที่ขับเคลื่อนผลลัพธ์ของแผน</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MetricTile label="ยอดขายเดือนแรก" value={formatBaht(scenario.firstMonthSales)} />
          <MetricTile label="Gross Margin" value={formatPercent(scenario.grossMargin, 0)} />
          <MetricTile label="เติบโตปีแรก ๆ" value={formatPercent(scenario.earlyGrowth, 0)} />
          <MetricTile label="ปีที่หนี้หมด" value={scenario.debtFreeYears} tone="gold" />
          <MetricTile
            label="CF สะสมปีที่ 10"
            value={scenario.cfYear10}
            tone="gold"
            className="col-span-2"
          />
        </div>
      </GlassCard>

      <GlassCard className="fade-up stagger-2 overflow-x-auto">
        <h3 className="text-base font-bold tracking-tight">ตารางเปรียบเทียบ</h3>
        <div className="surface-inset mt-3 overflow-hidden p-1">
          <table className="w-full min-w-[320px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-[11px] text-muted">
                <th className="px-2.5 py-2.5 font-medium">ตัวแปร</th>
                {SCENARIOS.map((s) => (
                  <th key={s.id} className="px-2 py-2.5 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[13px]">
              <CompareRow
                label="ยอดขายเดือนแรก"
                values={SCENARIOS.map((s) => formatBaht(s.firstMonthSales, true))}
                activeIndex={activeIndex}
              />
              <CompareRow
                label="Gross Margin"
                values={SCENARIOS.map((s) => formatPercent(s.grossMargin, 0))}
                activeIndex={activeIndex}
              />
              <CompareRow
                label="เติบโตปีแรก ๆ"
                values={SCENARIOS.map((s) => formatPercent(s.earlyGrowth, 0))}
                activeIndex={activeIndex}
              />
              <CompareRow
                label="ปีที่หนี้หมด"
                values={SCENARIOS.map((s) => s.debtFreeYears)}
                activeIndex={activeIndex}
              />
              <CompareRow
                label="CF ปีที่ 10"
                values={SCENARIOS.map((s) => s.cfYear10)}
                activeIndex={activeIndex}
              />
            </tbody>
          </table>
        </div>
      </GlassCard>
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
      <td className="px-2.5 py-2.5 text-muted">{label}</td>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={`px-2 py-2.5 font-semibold ${
            index === activeIndex ? 'text-gold' : 'text-ink/90'
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  )
}
