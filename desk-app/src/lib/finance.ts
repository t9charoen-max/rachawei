import { PHASE1_DEBT, SCENARIOS, type ScenarioId } from './plan-data'

/** Annual loan payment (annuity). ratePercent e.g. 6.5, years e.g. 8 */
export function annualLoanPayment(principal: number, ratePercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0
  const r = ratePercent / 100
  if (r === 0) return principal / years
  const factor = Math.pow(1 + r, years)
  return (principal * r * factor) / (factor - 1)
}

export function year1Interest(principal: number, ratePercent: number): number {
  return principal * (ratePercent / 100)
}

export interface CapitalProjection {
  firstMonthSales: number
  annualSalesY1: number
  grossProfitY1: number
  opexY1: number
  contributionY1: number
  phase1Loan: number
  phase1AnnualPayment: number
  phase1Year1Interest: number
  phase1Year1Principal: number
  currentHelpAnnual: number
  coverageRatio: number
  estimatedDebtFreeYearBe: string
  scenarioMatch: ScenarioId | 'custom'
  riskLevel: 'ต่ำ' | 'ปานกลาง' | 'สูง'
}

function matchScenario(sales: number, margin: number, growth: number): ScenarioId | 'custom' {
  const hit = SCENARIOS.find(
    (s) =>
      s.firstMonthSales === sales &&
      Math.abs(s.grossMargin - margin) < 0.5 &&
      Math.abs(s.earlyGrowth - growth) < 0.5,
  )
  return hit?.id ?? 'custom'
}

function estimateDebtFree(sales: number, margin: number, growth: number): string {
  const score =
    (sales / 250_000) * 0.45 + (margin / 22) * 0.3 + (growth / 25) * 0.25

  if (score >= 1.25) return '2577–78'
  if (score >= 1.05) return '2578–79'
  if (score >= 0.9) return '2579–80'
  if (score >= 0.7) return '2580–82'
  return '2581–83'
}

function riskFromCoverage(coverage: number): 'ต่ำ' | 'ปานกลาง' | 'สูง' {
  if (coverage >= 1.35) return 'ต่ำ'
  if (coverage >= 0.85) return 'ปานกลาง'
  return 'สูง'
}

export function projectCapital(
  firstMonthSales: number,
  grossMarginPercent = 22,
  earlyGrowthPercent = 25,
): CapitalProjection {
  const annualSalesY1 = firstMonthSales * 12
  const grossProfitY1 = annualSalesY1 * (grossMarginPercent / 100)
  const opexY1 = annualSalesY1 * 0.12
  const contributionY1 = grossProfitY1 - opexY1
  const currentHelpAnnual = 216_000
  const phase1AnnualPayment = PHASE1_DEBT.annualPayment
  const coverageRatio = (contributionY1 + currentHelpAnnual) / phase1AnnualPayment

  return {
    firstMonthSales,
    annualSalesY1,
    grossProfitY1,
    opexY1,
    contributionY1,
    phase1Loan: PHASE1_DEBT.principal,
    phase1AnnualPayment,
    phase1Year1Interest: PHASE1_DEBT.year1Interest,
    phase1Year1Principal: PHASE1_DEBT.year1Principal,
    currentHelpAnnual,
    coverageRatio,
    estimatedDebtFreeYearBe: estimateDebtFree(
      firstMonthSales,
      grossMarginPercent,
      earlyGrowthPercent,
    ),
    scenarioMatch: matchScenario(firstMonthSales, grossMarginPercent, earlyGrowthPercent),
    riskLevel: riskFromCoverage(coverageRatio),
  }
}

export function loanBreakdown(principal: number, ratePercent: number, years: number) {
  const annual = annualLoanPayment(principal, ratePercent, years)
  const interestY1 = year1Interest(principal, ratePercent)
  return {
    annual,
    monthly: annual / 12,
    interestY1,
    principalY1: annual - interestY1,
  }
}
