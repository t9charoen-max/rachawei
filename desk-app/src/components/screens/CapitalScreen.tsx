import { useMemo, useState } from 'react'
import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { MetricTile, ScreenHeader, SectionKicker } from '../ui'
import { SALES_PRESETS, SCENARIOS } from '../../lib/plan-data'
import { projectCapital, loanBreakdown } from '../../lib/finance'
import { formatBaht, formatPercent } from '../../lib/format'

export function CapitalScreen() {
  const [sales, setSales] = useState(250_000)
  const [margin, setMargin] = useState(22)
  const [growth, setGrowth] = useState(25)

  const projection = useMemo(
    () => projectCapital(sales, margin, growth),
    [sales, margin, growth],
  )

  const phase1 = loanBreakdown(3_500_000, 6.5, 8)
  const phase2 = loanBreakdown(6_000_000, 6.0, 7)
  const activePreset = SALES_PRESETS.find((p) => p.value === sales)?.id

  const riskTone =
    projection.riskLevel === 'ต่ำ'
      ? 'good'
      : projection.riskLevel === 'สูง'
        ? 'warn'
        : 'gold'

  return (
    <div className="space-y-4">
      <ScreenHeader
        brand={<BrandMark />}
        subtitle="เลือกยอดขาย → ดูกำลังจ่ายหนี้ตามระบบ"
      />

      <GlassCard className="fade-up stagger-1">
        <SectionKicker>จำลองทุนเฟส 1</SectionKicker>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight">ยอดขายเดือนแรก</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          ตั้งสมมติฐานยอดขายวัสดุ → ระบบคำนวณความครอบคลุมงวดหนี้
        </p>

        <p className="mt-4 text-xs font-medium text-muted">เลือกยอดขาย</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {SALES_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`pill pressable px-2 py-2.5 text-sm ${
                activePreset === preset.id ? 'pill-active' : ''
              }`}
              onClick={() => {
                setSales(preset.value)
                const scenario = SCENARIOS.find((s) => s.firstMonthSales === preset.value)
                if (scenario) {
                  setMargin(scenario.grossMargin)
                  setGrowth(scenario.earlyGrowth)
                }
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-muted" htmlFor="sales-input">
          หรือใส่เอง
        </label>
        <input
          id="sales-input"
          className="field mt-1.5 text-center text-lg font-semibold tracking-wide"
          type="number"
          min={50_000}
          step={10_000}
          value={sales}
          onChange={(e) => setSales(Number(e.target.value) || 0)}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-muted">
            Gross Margin (%)
            <input
              className="field mt-1.5 text-center"
              type="number"
              min={10}
              max={40}
              step={1}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 0)}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            เติบโตปีแรก ๆ (%)
            <input
              className="field mt-1.5 text-center"
              type="number"
              min={0}
              max={60}
              step={1}
              value={growth}
              onChange={(e) => setGrowth(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MetricTile label="ยอดขายปีแรก" value={formatBaht(projection.annualSalesY1, true)} />
          <MetricTile label="กำไรขั้นต้น" value={formatBaht(projection.grossProfitY1, true)} />
          <MetricTile label="ช่วยจ่ายหนี้" value={formatBaht(projection.contributionY1, true)} />
          <MetricTile label="งวดหนี้/ปี" value={formatBaht(projection.phase1AnnualPayment, true)} />
        </div>

        <div className="surface-inset mt-5 grid grid-cols-3 gap-2 p-3.5">
          <div>
            <p className="text-[11px] text-muted">Coverage</p>
            <p className="mt-1 text-lg font-bold text-gold brand-glow">
              {projection.coverageRatio.toFixed(2)}x
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted">ความเสี่ยง</p>
            <p
              className={`mt-1 text-lg font-bold ${
                riskTone === 'good'
                  ? 'text-good'
                  : riskTone === 'warn'
                    ? 'text-warn'
                    : 'text-gold'
              }`}
            >
              {projection.riskLevel}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted">หนี้หมด ~</p>
            <p className="mt-1 text-lg font-bold text-gold">
              {projection.estimatedDebtFreeYearBe}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="fade-up stagger-2">
        <h3 className="text-base font-bold tracking-tight">โครงสร้างเงินกู้</h3>
        <div className="mt-3 space-y-3">
          <LoanRow
            title="เฟส 1 · ตึกหน้า"
            principal={3_500_000}
            rate={6.5}
            years={8}
            annual={phase1.annual}
            interestY1={phase1.interestY1}
            principalY1={phase1.principalY1}
          />
          <LoanRow
            title="เฟส 2 · โกดัง"
            principal={6_000_000}
            rate={6.0}
            years={7}
            annual={phase2.annual}
            interestY1={phase2.interestY1}
            principalY1={phase2.principalY1}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-dim">
          เงินสดลงเฟส 1: {formatBaht(1_000_000)} · เงินสดจากกำไรเฟส 2:{' '}
          {formatBaht(2_500_000)} · Margin ที่ใช้: {formatPercent(margin, 0)}
        </p>
      </GlassCard>
    </div>
  )
}

function LoanRow({
  title,
  principal,
  rate,
  years,
  annual,
  interestY1,
  principalY1,
}: {
  title: string
  principal: number
  rate: number
  years: number
  annual: number
  interestY1: number
  principalY1: number
}) {
  return (
    <div className="surface-raised p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <p className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">
          {formatPercent(rate, 1)} · {years} ปี
        </p>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Mini label="วงเงินกู้" value={formatBaht(principal, true)} />
        <Mini label="ผ่อน/ปี" value={formatBaht(annual, true)} />
        <Mini label="ดอกเบี้ยปี 1" value={formatBaht(interestY1, true)} />
        <Mini label="เงินต้นปี 1" value={formatBaht(principalY1, true)} />
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-dim">{label}</p>
      <p className="mt-0.5 font-semibold text-sky-value">{value}</p>
    </div>
  )
}
