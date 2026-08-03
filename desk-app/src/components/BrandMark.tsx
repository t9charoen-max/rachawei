export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const text =
    size === 'lg' ? 'text-[2.05rem] sm:text-5xl' : size === 'sm' ? 'text-xl' : 'text-[1.75rem]'

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`brand-glow font-extrabold tracking-tight text-gold ${text}`}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        ราชาวัสดุ
      </span>
      <span
        className="rounded-full border border-gold/35 bg-gradient-to-b from-gold/20 to-gold/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-gold-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(201,162,39,0.18)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        DESK
      </span>
    </div>
  )
}
