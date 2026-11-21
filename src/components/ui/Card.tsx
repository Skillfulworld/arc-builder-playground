import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Stronger surface for the dominant card on a screen. */
  strong?: boolean
}

export function Card({ className, strong, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-line p-5 shadow-card backdrop-blur-xl sm:p-6',
        strong ? 'bg-surface-strong' : 'bg-surface',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('display text-lg font-semibold text-ink', className)} {...props} />
}
