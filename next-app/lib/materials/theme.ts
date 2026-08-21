export const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'ปูนและคอนกรีต': { bg: 'bg-slate-500/25', text: 'text-slate-200', accent: '#94a3b8' },
  'เหล็กโครงสร้าง': { bg: 'bg-zinc-500/25', text: 'text-zinc-200', accent: '#a1a1aa' },
  'ไม้แบบและไม้แปรรูป': { bg: 'bg-amber-500/20', text: 'text-amber-200', accent: '#fbbf24' },
  'หลังคาและผนัง': { bg: 'bg-sky-500/25', text: 'text-sky-200', accent: '#38bdf8' },
  'สีและเคมีภัณฑ์': { bg: 'bg-indigo-500/25', text: 'text-indigo-200', accent: '#818cf8' },
  'ระบบประปา': { bg: 'bg-cyan-500/25', text: 'text-cyan-200', accent: '#22d3ee' },
  'ระบบไฟฟ้า': { bg: 'bg-yellow-500/20', text: 'text-yellow-200', accent: '#facc15' },
  'เครื่องมือช่าง': { bg: 'bg-rose-500/20', text: 'text-rose-200', accent: '#fb7185' },
};

export function getCategoryStyle(category: string) {
  return (
    CATEGORY_COLORS[category] ?? {
      bg: 'bg-blue-500/25',
      text: 'text-blue-200',
      accent: '#60a5fa',
    }
  );
}
