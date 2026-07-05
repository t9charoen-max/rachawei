export function WovenDivider() {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rotate-45 rounded-sm bg-gold-500/60"
          />
        ))}
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/30 to-transparent" />
    </div>
  );
}
