export type ScenarioId = 'base' | 'optimistic' | 'conservative'

export type PhaseId = '0' | '1' | '2' | '3' | 'home'

export interface Phase {
  id: PhaseId
  name: string
  period: string
  summary: string
  budget: number
  budgetLabel: string
  loan?: number
  cash?: number
  rate?: number
  years?: number
  highlight: string
}

export interface Scenario {
  id: ScenarioId
  name: string
  firstMonthSales: number
  grossMargin: number
  earlyGrowth: number
  debtFreeYears: string
  cfYear10: string
  color: string
}

export interface CashflowRow {
  year: number
  materialSales: number
  totalRevenue: number
  netProfit: number
  netCf: number
  cumulativeCf: number
  debtEnd: number
  status: string
}

export const BRAND = {
  name: 'ราชาวัสดุ',
  short: 'RWS',
  desk: 'DESK',
  tagline: 'จากศูนย์ → กู้สร้างตึกหน้า → ขยายโกดัง → โครงการเต็ม → บ้านพักเมื่อหนี้หมด',
  principle: 'ใช้หนี้เฉพาะส่วนที่สร้าง cashflow ใหม่ได้ชัดเจน',
  updatedAt: '30 ก.ค. 2569',
} as const

export const PHASES: Phase[] = [
  {
    id: '0',
    name: 'เฟส 0 · เตรียมตัว',
    period: '2569–2570',
    summary: 'เตรียมเอกสาร + เคลียร์หนี้เล็กน้อย + ออกแบบ',
    budget: 0,
    budgetLabel: 'งบต่ำ',
    highlight: 'เคลียร์หนี้เล็ก + เอกสารที่ดิน + ออกแบบตึก',
  },
  {
    id: '1',
    name: 'เฟส 1 · ตึกหน้า',
    period: '2570–2571',
    summary: 'กู้สร้างตึกหน้า 2 ชั้น + เปิดร้านวัสดุ + คาเฟ่',
    budget: 4_500_000,
    budgetLabel: '4.5 ล้าน',
    loan: 3_500_000,
    cash: 1_000_000,
    rate: 6.5,
    years: 8,
    highlight: 'เปิดดำเนินการปี 2571 · ยอดขายเดือนแรก 250,000',
  },
  {
    id: '2',
    name: 'เฟส 2 · โกดัง',
    period: '2573–2574',
    summary: 'สร้างโกดัง Prefab + พื้นที่จัดเก็บกลางแจ้ง',
    budget: 8_500_000,
    budgetLabel: '8.5 ล้าน',
    loan: 6_000_000,
    cash: 2_500_000,
    rate: 6.0,
    years: 7,
    highlight: 'เปิดโกดังปี 2574 · ยอดขายเพิ่มเดือนแรก 400,000',
  },
  {
    id: '3',
    name: 'เฟส 3 · ขยายเต็ม',
    period: '2576+',
    summary: 'ขยายเต็มรูปแบบตามภาพใหญ่',
    budget: 12_000_000,
    budgetLabel: '12 ล้าน+',
    highlight: 'ขยายเมื่อมี cashflow จากเฟสก่อนหน้าช่วยจ่ายหนี้',
  },
  {
    id: 'home',
    name: 'เฟสสุดท้าย · บ้านพัก',
    period: 'หลังหนี้หมด',
    summary: 'สร้างบ้านพักอาศัยส่วนตัวภายในโครงการ',
    budget: 3_500_000,
    budgetLabel: '3.5 ล้าน (เงินสด)',
    cash: 3_500_000,
    highlight: 'สร้างด้วยเงินสดล้วน หลังหนี้ธุรกิจเป็นศูนย์',
  },
]

export type KeyMetric =
  | { label: string; value: number; valueLabel?: never }
  | { label: string; valueLabel: string; value?: never }

export const KEY_METRICS: KeyMetric[] = [
  { label: 'ต้นทุนเฟส 1', value: 4_500_000 },
  { label: 'เงินกู้เฟส 1', value: 3_500_000 },
  { label: 'ดอกเบี้ยเฟส 1', valueLabel: '6.5% / ปี' },
  { label: 'ระยะเวลากู้เฟส 1', valueLabel: '8 ปี' },
  { label: 'ต้นทุนเฟส 2', value: 8_500_000 },
  { label: 'เงินกู้เฟส 2', value: 6_000_000 },
  { label: 'ยอดขายเดือนแรก', value: 250_000 },
  { label: 'Gross Margin', valueLabel: '22%' },
  { label: 'รายได้ช่วยโครงการ/ปี', value: 216_000 },
  { label: 'ต้นทุนบ้านพัก', value: 3_500_000 },
]

export const PRINCIPLES = [
  'ใช้หนี้ (Leverage) เฉพาะส่วนที่สร้าง cashflow ใหม่ได้ชัดเจน',
  'ทุกเฟสต้องมีรายได้ใหม่มาช่วยจ่ายหนี้ก่อนขยายต่อ',
  'เป้าหมายสูงสุด = หนี้ธุรกิจเป็นศูนย์ → ค่อยสร้างบ้านพักอาศัย',
  'รีวิวแผนทุก 6 เดือนตามยอดขายจริง',
  'เก็บเงินสำรองฉุกเฉินอย่างน้อย 6–12 เดือนของค่าใช้จ่าย + งวดหนี้',
]

export const ASSUMPTIONS = [
  {
    title: 'รายได้ปัจจุบันที่ช่วยโครงการ',
    body: 'ร้านยาสุทธิ 30,000 + เงินเดือน 10,000 + อื่น ๆ 5,000 บาท/เดือน → นำมาช่วย 40% = 216,000 บาท/ปี',
  },
  {
    title: 'เฟส 1 – ตึกด้านหน้า',
    body: 'ต้นทุน 4.5 ล้าน | เงินสด 1 ล้าน | กู้ 3.5 ล้าน ดอกเบี้ย 6.5% 8 ปี | Margin 22% | OpEx 12% ของยอดขาย | คาเฟ่สุทธิ ~15,000/เดือน (ปี 2)',
  },
  {
    title: 'เฟส 2 – โกดัง + จัดเก็บ',
    body: 'ต้นทุน 8.5 ล้าน | เงินสดจากกำไร 2.5 ล้าน | กู้ 6 ล้าน ดอกเบี้ย 6.0% 7 ปี | ยอดขายเพิ่มเดือนแรก 400,000',
  },
  {
    title: 'เฟส 3 + บ้านพัก',
    body: 'ขยายเต็มรูปแบบเพิ่ม 12 ล้าน (เริ่มปี 2576) | บ้านพัก 3.5 ล้าน — เงินสดล้วนหลังหนี้หมด | เงินเฟ้อ 3%/ปี | ภาษี ~20%',
  },
]

export const PHASE1_DEBT = {
  principal: 3_500_000,
  annualPayment: 574_831,
  year1Interest: 227_500,
  year1Principal: 347_331,
}

export const CASHFLOW_HIGHLIGHTS: CashflowRow[] = [
  {
    year: 2027,
    materialSales: 0,
    totalRevenue: 216_000,
    netProfit: 172_800,
    netCf: -827_200,
    cumulativeCf: -827_200,
    debtEnd: 3_500_000,
    status: 'ยังมีหนี้',
  },
  {
    year: 2028,
    materialSales: 3_000_000,
    totalRevenue: 3_402_480,
    netProfit: 461_884,
    netCf: 204_384,
    cumulativeCf: -622_816,
    debtEnd: 3_062_500,
    status: 'ยังมีหนี้',
  },
  {
    year: 2030,
    materialSales: 4_687_500,
    totalRevenue: 5_114_491,
    netProfit: 616_493,
    netCf: -2_141_007,
    cumulativeCf: -2_489_780,
    debtEnd: 8_187_500,
    status: 'ยังมีหนี้',
  },
  {
    year: 2031,
    materialSales: 10_659_375,
    totalRevenue: 11_099_176,
    netProfit: 960_491,
    netCf: 185_848,
    cumulativeCf: -2_303_932,
    debtEnd: 6_892_857,
    status: 'ยังมีหนี้',
  },
  {
    year: 2035,
    materialSales: 14_501_962,
    totalRevenue: 14_996_962,
    netProfit: 1_312_057,
    netCf: 1_017_414,
    cumulativeCf: -11_272_780,
    debtEnd: 1_714_286,
    status: 'ยังมีหนี้',
  },
  {
    year: 2037,
    materialSales: 16_915_088,
    totalRevenue: 17_440_234,
    netProfit: 1_629_323,
    netCf: -870_677,
    cumulativeCf: -9_626_608,
    debtEnd: 0,
    status: 'พร้อมสร้างบ้าน',
  },
]

export const CASHFLOW_NOTES = [
  'ปี 2570: ก่อสร้างเฟส 1 → กระแสเงินสดติดลบจากเงินลงทุน (มีเงินกู้เข้ามาชดเชย)',
  'ปี 2571: เปิดร้าน → เริ่มมีรายได้จากวัสดุ + คาเฟ่ + รายได้เดิมที่ช่วย',
  'ปี 2573–2574: ก่อสร้างและเปิดโกดัง → ยอดขายกระโดดขึ้น',
  'ปี 2578+: หนี้ลดลงต่อเนื่อง กระแสเงินสดสะสมเพิ่มขึ้น',
  'ปี 2580 (ประมาณ): หนี้ใกล้หมด → พร้อมสร้างบ้านด้วยเงินสด',
]

export const SCENARIOS: Scenario[] = [
  {
    id: 'base',
    name: 'Base',
    firstMonthSales: 250_000,
    grossMargin: 22,
    earlyGrowth: 25,
    debtFreeYears: '2579–80',
    cfYear10: '8–12 ล้าน',
    color: '#c9a227',
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    firstMonthSales: 350_000,
    grossMargin: 25,
    earlyGrowth: 35,
    debtFreeYears: '2577–78',
    cfYear10: '15–20 ล้าน',
    color: '#34d399',
  },
  {
    id: 'conservative',
    name: 'Conservative',
    firstMonthSales: 180_000,
    grossMargin: 18,
    earlyGrowth: 15,
    debtFreeYears: '2581–83',
    cfYear10: '3–6 ล้าน',
    color: '#60a5fa',
  },
]

export const ACTION_ITEMS = [
  'เคลียร์หนี้เล็กน้อยที่มีอยู่ให้หมดก่อน',
  'จัดทำเอกสารที่ดินให้พร้อม (โฉนด + ขออนุญาตใช้ที่ดินเพื่อกิจการพาณิชย์)',
  'จ้างสถาปนิก/วิศวกรท้องถิ่นออกแบบตึกเฟส 1 และประมาณการงบจริง',
  'เตรียมแผนธุรกิจสั้น ๆ เพื่อยื่นกู้ SME',
  'เปรียบเทียบข้อเสนอสินเชื่อจาก ออมสิน / กสิกร / กรุงไทย / อื่น ๆ',
  'เปิดบัญชีธุรกิจแยก + ลงทะเบียนพาณิชย์',
]

export const WARNINGS = [
  'อย่ากู้เกินกำลัง — ทุกเฟสต้องมี cashflow ใหม่มาช่วยจ่ายหนี้ก่อนขยาย',
  'ยอดขายวัสดุในชนบทอาจช้ากว่าคาด → เตรียมแผน Conservative ไว้เสมอ',
  'ต้นทุนก่อสร้างอาจสูงขึ้นจากเงินเฟ้อ → เผื่องบ contingency 10–15%',
  'อย่าสร้างบ้านพักอาศัยจนกว่าหนี้ธุรกิจจะหมดจริง',
]

export const SALES_PRESETS = [
  { id: '180k', label: '180k', value: 180_000 },
  { id: '250k', label: '250k', value: 250_000 },
  { id: '350k', label: '350k', value: 350_000 },
  { id: '500k', label: '500k', value: 500_000 },
] as const
