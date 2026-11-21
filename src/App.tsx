import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Guestbook } from '@/components/guestbook/Guestbook'
import { SwapExplorer } from '@/components/swap/SwapExplorer'
import { useSection } from '@/hooks/useSection'

export default function App() {
  const { section, navigate } = useSection()

  useEffect(() => {
    document.title = `${section === 'swap' ? 'Swap Explorer' : 'Onchain Guestbook'} · Arc Builder Playground`
  }, [section])

  return (
    <AppShell section={section} onNavigate={navigate}>
      {section === 'swap' ? <SwapExplorer /> : <Guestbook />}
    </AppShell>
  )
}
