import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'accent'

const tones: Record<Tone, string> = {
  neutral: 'border-line text-muted',
  success: 'border-success/30 text-success bg-success/10',
  danger: 'border-danger/30 text-danger bg-danger/10',
  warning: 'border-warning/30 text-warning bg-warning/10',
  accent: 'border-accent/30 text-accent bg-accent/10',
}

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.06em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
