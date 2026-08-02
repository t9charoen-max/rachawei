import type { ReactNode } from 'react'

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`glass-panel p-4 sm:p-5 ${className}`}>{children}</section>
}
