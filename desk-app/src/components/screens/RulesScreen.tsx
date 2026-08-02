import { GlassCard } from '../GlassCard'
import { BrandMark } from '../BrandMark'
import { ACTION_ITEMS, ASSUMPTIONS, PRINCIPLES, WARNINGS } from '../../lib/plan-data'

export function RulesScreen() {
  return (
    <div className="space-y-4">
      <header className="fade-up px-1 pt-1">
        <BrandMark />
        <p className="mt-1 text-sm text-muted">หลักการ · ข้อควรระวัง · ทำทันที</p>
      </header>

      <GlassCard className="fade-up stagger-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-soft">
          หลักการสำคัญตลอดทาง
        </p>
        <ol className="mt-3 space-y-2.5">
          {PRINCIPLES.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed">{item}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      <GlassCard className="fade-up stagger-2">
        <h3 className="text-base font-bold">เฟส 0 · ทำทันที</h3>
        <ul className="mt-3 space-y-2">
          {ACTION_ITEMS.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="font-semibold text-gold">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="fade-up stagger-3">
        <h3 className="text-base font-bold">จุดที่ควรระวัง</h3>
        <ul className="mt-3 space-y-2">
          {WARNINGS.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-sm leading-relaxed text-rose-100/90"
            >
              {item}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <h3 className="text-base font-bold">สมมติฐานรายละเอียด</h3>
        <div className="mt-3 space-y-3">
          {ASSUMPTIONS.map((item) => (
            <div key={item.title}>
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
