export const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'ปูนและคอนกรีต': { bg: 'bg-slate-100', text: 'text-slate-700', accent: '#64748b' },
  'เหล็กโครงสร้าง': { bg: 'bg-zinc-100', text: 'text-zinc-700', accent: '#52525b' },
  'ไม้แบบและไม้แปรรูป': { bg: 'bg-amber-100', text: 'text-amber-800', accent: '#d97706' },
  'หลังคาและผนัง': { bg: 'bg-sky-100', text: 'text-sky-800', accent: '#0284c7' },
  'สีและเคมีภัณฑ์': { bg: 'bg-violet-100', text: 'text-violet-800', accent: '#7c3aed' },
  'ระบบประปา': { bg: 'bg-cyan-100', text: 'text-cyan-800', accent: '#0891b2' },
  'ระบบไฟฟ้า': { bg: 'bg-yellow-100', text: 'text-yellow-800', accent: '#ca8a04' },
  'เครื่องมือช่าง': { bg: 'bg-rose-100', text: 'text-rose-800', accent: '#e11d48' },
};

export function getCategoryStyle(category: string) {
  return (
    CATEGORY_COLORS[category] ?? {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      accent: '#ea580c',
    }
  );
}
