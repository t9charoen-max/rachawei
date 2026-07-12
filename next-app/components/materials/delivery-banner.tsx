import { DELIVERY_ZONES } from '@/lib/materials/delivery';

export function DeliveryBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50 shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-3xl shadow-lg sm:h-20 sm:w-20 sm:text-4xl">
            🚚
          </div>
          <div>
            <h2 className="text-xl font-bold text-teal-900 sm:text-2xl">
              ส่งถึงหน้างาน — ทั่วสุรินทร์และใกล้เคียง
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-800/80 sm:text-base">
              สั่งวัสดุแล้วจัดส่งตรงถึงหน้างานก่อสร้าง ไม่ต้องขนของเอง • ปรึกษาเส้นทางและค่าส่งฟรีผ่าน
              Line
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {DELIVERY_ZONES.map((zone) => (
                <span
                  key={zone}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-700 shadow-sm ring-1 ring-teal-100"
                >
                  📍 {zone}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                พร้อมส่ง 1-2 วัน
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                สั่งจอง 3-5 วัน
              </span>
              <span className="text-gray-500">• ยอดสั่ง 5,000+ บาท ปรึกษาส่งฟรี</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
