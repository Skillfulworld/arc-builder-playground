import type { ReactNode } from 'react'
import { AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'info' | 'warning' | 'danger'

const styles: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-line bg-surface text-muted', icon: Info },
  warning: { box: 'border-warning/30 bg-warning/10 text-warning', icon: AlertTriangle },
  danger: { box: 'border-danger/30 bg-danger/10 text-danger', icon: XCircle },
}

export function Notice({ tone = 'info', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const { box, icon: Icon } = styles[tone]
  return (
    <div role={tone === 'info' ? 'note' : 'alert'} className={cn('flex gap-3 rounded-2xl border p-3.5 text-sm', box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-pretty">{children}</div>
    </div>
  )
}
