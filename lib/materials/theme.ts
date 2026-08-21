export const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'ปูนและคอนกรีต': { bg: 'bg-stone-500/25', text: 'text-stone-200', accent: '#a8a29e' },
  'เหล็กโครงสร้าง': { bg: 'bg-zinc-500/25', text: 'text-zinc-200', accent: '#a1a1aa' },
  'ไม้แบบและไม้แปรรูป': { bg: 'bg-amber-500/25', text: 'text-amber-200', accent: '#fbbf24' },
  'หลังคาและผนัง': { bg: 'bg-yellow-500/20', text: 'text-yellow-100', accent: '#f0d78c' },
  'สีและเคมีภัณฑ์': { bg: 'bg-orange-500/20', text: 'text-orange-100', accent: '#fb923c' },
  'ระบบประปา': { bg: 'bg-teal-500/20', text: 'text-teal-100', accent: '#5eead4' },
  'ระบบไฟฟ้า': { bg: 'bg-amber-400/20', text: 'text-amber-100', accent: '#fcd34d' },
  'เครื่องมือช่าง': { bg: 'bg-rose-500/20', text: 'text-rose-100', accent: '#fb7185' },
};

export function getCategoryStyle(category: string) {
  return (
    CATEGORY_COLORS[category] ?? {
      bg: 'bg-amber-500/20',
      text: 'text-amber-100',
      accent: '#d4af37',
    }
  );
}
