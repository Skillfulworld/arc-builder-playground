import { FlaskConical } from 'lucide-react'
import type { Section } from '@/hooks/useSection'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav'

interface SidebarProps {
  section: Section
  onNavigate: (section: Section) => void
}

/** Desktop navigation rail. */
export function Sidebar({ section, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        <nav aria-label="Sections" className="space-y-1.5">
          {NAV_ITEMS.map(({ id, label, blurb, icon: Icon }) => {
            const active = id === section
            return (
              <a
                key={id}
                href={`/${id}`}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(id)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition',
                  active
                    ? 'border-line bg-surface-strong text-ink'
                    : 'border-transparent text-muted hover:bg-surface hover:text-ink',
                )}
              >
                <Icon className={cn('size-5 shrink-0', active && 'text-accent')} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block truncate text-xs text-subtle">{blurb}</span>
                </span>
              </a>
            )
          })}
        </nav>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FlaskConical className="size-4 text-accent" aria-hidden />
            Educational prototype
          </div>
          <p className="mt-2 text-pretty text-xs text-subtle">
            Runs on Arc Testnet only. Nothing here is financial advice, and no transactions are sent from the swap
            section.
          </p>
        </div>
      </div>
    </aside>
  )
}
