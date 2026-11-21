import { CheckCircle2, CircleDashed } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'

export interface ChecklistItem {
  label: string
  ready: boolean
  /** Shown under the label. For missing items, name the env var or next step. */
  detail: string
}

/** Shows which live dependencies are configured, so nothing is silently faked. */
export function SetupChecklist({ title, items }: { title: string; items: ChecklistItem[] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.label} className="flex gap-3">
            {item.ready ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Ready" />
            ) : (
              <CircleDashed className="mt-0.5 size-5 shrink-0 text-subtle" aria-label="Not configured" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="mono mt-0.5 break-words text-xs text-subtle">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
