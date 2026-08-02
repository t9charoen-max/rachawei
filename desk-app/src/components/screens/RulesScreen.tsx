import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { ScreenHeader, SectionKicker } from '../ui'
import { ACTION_ITEMS, ASSUMPTIONS, PRINCIPLES, WARNINGS } from '../../lib/plan-data'

export function RulesScreen() {
  return (
    <div className="space-y-4">
      <ScreenHeader
        brand={<BrandMark />}
        subtitle="หลักการ · ข้อควรระวัง · ทำทันที"
      />

      <GlassCard className="fade-up stagger-1">
        <SectionKicker>หลักการสำคัญตลอดทาง</SectionKicker>
        <ol className="mt-3 space-y-2.5">
          {PRINCIPLES.map((item, index) => (
            <li key={item} className="surface-raised flex gap-3 px-3 py-3">
              <span className="phase-node shrink-0 !size-7 !text-[11px]">{index + 1}</span>
              <p className="text-sm leading-relaxed">{item}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      <GlassCard className="fade-up stagger-2">
        <h3 className="text-base font-bold tracking-tight">เฟส 0 · ทำทันที</h3>
        <ul className="mt-3 space-y-2">
          {ACTION_ITEMS.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-0.5 font-bold text-gold">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="fade-up stagger-3">
        <h3 className="text-base font-bold tracking-tight">จุดที่ควรระวัง</h3>
        <ul className="mt-3 space-y-2">
          {WARNINGS.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-rose-400/25 bg-rose-400/8 px-3.5 py-3 text-sm leading-relaxed text-rose-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="fade-up stagger-4">
        <h3 className="text-base font-bold tracking-tight">สมมติฐานรายละเอียด</h3>
        <div className="mt-3 space-y-3">
          {ASSUMPTIONS.map((item) => (
            <div key={item.title} className="surface-raised px-3.5 py-3">
              <p className="text-sm font-semibold text-gold-soft">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-dim">
          เอกสารนี้จัดทำเพื่อวางแผนส่วนบุคคล ตัวเลขเป็นประมาณการจากสมมติฐานที่ระบุ
          แนะนำให้ปรับตามข้อมูลจริงและปรึกษาผู้เชี่ยวชาญด้านสินเชื่อ/ก่อสร้างก่อนตัดสินใจลงทุน
        </p>
      </GlassCard>
    </div>
  )
}
