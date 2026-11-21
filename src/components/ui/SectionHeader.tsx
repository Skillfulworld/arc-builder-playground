import type { ReactNode } from 'react'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description: ReactNode
  aside?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, aside }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle">{eyebrow}</p>
        <h1 className="display mt-2 text-balance text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-[65ch] text-pretty text-base text-muted">{description}</p>
      </div>
      {aside}
    </div>
  )
}
