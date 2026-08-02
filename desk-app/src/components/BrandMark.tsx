export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const text =
    size === 'lg' ? 'text-4xl sm:text-5xl' : size === 'sm' ? 'text-xl' : 'text-3xl'

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`font-display font-extrabold tracking-tight text-gold ${text}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ราชาวัสดุ
        </span>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] text-gold-soft">
          DESK
        </span>
      </div>
    </div>
  )
}
