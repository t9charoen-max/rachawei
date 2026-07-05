interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: 'gold' | 'sage' | 'terracotta';
}

const accentColors = {
  gold: 'text-gold-400',
  sage: 'text-sage-soft',
  terracotta: 'text-terracotta-soft',
};

export function SectionHeader({ eyebrow, title, subtitle, accent = 'gold' }: SectionHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400/50" />
        <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${accentColors[accent]}`}>
          {eyebrow}
        </p>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold-400/50" />
      </div>
      <h2 className="font-display text-[1.75rem] font-bold leading-snug text-cream-50 sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-cream-300/80">
          {subtitle}
        </p>
      )}
    </div>
  );
}
