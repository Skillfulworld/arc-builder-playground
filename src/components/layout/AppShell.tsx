import type { ReactNode } from 'react'
import type { Section } from '@/hooks/useSection'
import { Header } from './Header'
import { MobileTabs } from './MobileTabs'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  section: Section
  onNavigate: (section: Section) => void
  children: ReactNode
}

/** Dashboard frame: sticky header, desktop rail, mobile tabs, content column. */
export function AppShell({ section, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      <Header />
      <MobileTabs section={section} onNavigate={onNavigate} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:pt-10">
        <Sidebar section={section} onNavigate={onNavigate} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
