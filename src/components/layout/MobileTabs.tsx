import type { Section } from '@/hooks/useSection'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav'

interface MobileTabsProps {
  section: Section
  onNavigate: (section: Section) => void
}

/** Segmented section switcher shown below the header on small screens. */
export function MobileTabs({ section, onNavigate }: MobileTabsProps) {
  return (
    <nav aria-label="Sections" className="lg:hidden">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
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
                  'flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition',
                  active ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
