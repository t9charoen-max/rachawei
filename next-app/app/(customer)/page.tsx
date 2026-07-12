import type { Metadata } from 'next';
import ConstructionMaterialsStore from '@/components/construction-materials-store';

export const metadata: Metadata = {
  title: 'ราชาวัสดุ สุรินทร์ | วัสดุก่อสร้าง',
  description: 'วัสดุก่อสร้างคุณภาพ ส่งตรงถึงหน้างาน สุรินทร์และใกล้เคียง',
};

export default function HomePage() {
  return <ConstructionMaterialsStore />;
}
