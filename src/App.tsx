import { AppShell } from '@/components/layout/AppShell'
import { Guestbook } from '@/components/guestbook/Guestbook'
import { SwapExplorer } from '@/components/swap/SwapExplorer'
import { useSection } from '@/hooks/useSection'

export default function App() {
  const { section, navigate } = useSection()

  return (
    <AppShell section={section} onNavigate={navigate}>
      {section === 'swap' ? <SwapExplorer /> : <Guestbook />}
    </AppShell>
  )
}
