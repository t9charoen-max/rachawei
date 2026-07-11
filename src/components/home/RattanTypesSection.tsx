import { SectionHeader } from '../ui/SectionHeader';
import { RattanTypesList } from '../knowledge/RattanTypesList';

export function RattanTypesSection() {
  return (
    <section className="relative py-14 sm:py-16" aria-labelledby="rattan-types-title">
      <SectionHeader
        eyebrow="เกร็ดความรู้"
        title="ชนิดหวายที่ใช้"
        subtitle="ภูมิปัญญาท้องถิ่น บ้านบุทม จ.สุรินทร์"
        accent="sage"
      />
      <RattanTypesList />
    </section>
  );
}
