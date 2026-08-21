import { DELIVERY_ZONES } from '@/lib/materials/delivery';

export function DeliveryBanner() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-6">
      <div className="glass-panel light-sweep relative overflow-hidden rounded-3xl">
        <div className="light-orb -right-10 top-0 h-40 w-40 bg-amber-400/25" />
        <div className="pattern-dots absolute inset-0 opacity-30" />
        <div className="relative grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
          <div className="animate-pulse-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-3xl shadow-lg shadow-amber-500/30 sm:h-20 sm:w-20 sm:text-4xl">
            🚚
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-50 sm:text-2xl">
              ส่งถึงหน้างาน — ทั่วสุรินทร์และใกล้เคียง
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
              สั่งวัสดุแล้วจัดส่งตรงถึงหน้างานก่อสร้าง ไม่ต้องขนของเอง • ปรึกษาเส้นทางและค่าส่งฟรีผ่าน
              Line
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {DELIVERY_ZONES.map((zone) => (
                <span
                  key={zone}
                  className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100"
                >
                  📍 {zone}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                พร้อมส่ง 1-2 วัน
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                สั่งจอง 3-5 วัน
              </span>
              <span className="text-slate-500">• ยอดสั่ง 5,000+ บาท ปรึกษาส่งฟรี</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
