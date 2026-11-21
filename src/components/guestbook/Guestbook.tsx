import { Badge } from '@/components/ui/Badge'
import { AddressLink } from '@/components/ui/AddressLink'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import { useGuestbookMessages } from '@/hooks/useGuestbook'
import { useInjectedWallet } from '@/hooks/useInjectedWallet'
import { usePublishMessage } from '@/hooks/usePublishMessage'
import { GUESTBOOK_ADDRESS, GUESTBOOK_WRITES_ENABLED } from '@/lib/env'
import { ContractPlan } from './ContractPlan'
import { MessageForm } from './MessageForm'
import { MessageList } from './MessageList'

export function Guestbook() {
  const guestbook = useGuestbookMessages()
  const publish = usePublishMessage()
  const wallet = useInjectedWallet()

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Section 02"
        title="Onchain Guestbook"
        description="Connect a wallet, publish a public message, and read what others left. Every message lives in a smart contract on Arc, not on a server."
        aside={
          GUESTBOOK_ADDRESS ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">Contract set</Badge>
              <AddressLink address={GUESTBOOK_ADDRESS} />
            </div>
          ) : (
            <Badge tone="warning">Contract pending</Badge>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <MessageForm publish={publish} onPosted={guestbook.refetch} />
          {!GUESTBOOK_ADDRESS && <ContractPlan />}
        </div>
        <div className="space-y-6">
          <MessageList guestbook={guestbook} publish={publish} />
          <SetupChecklist
            title="Setup status"
            items={[
              wallet,
              {
                label: 'Guestbook contract',
                ready: Boolean(GUESTBOOK_ADDRESS),
                detail: GUESTBOOK_ADDRESS ? 'VITE_GUESTBOOK_ADDRESS is set' : 'Missing: deploy it, then set VITE_GUESTBOOK_ADDRESS',
              },
              {
                label: 'Transactions',
                ready: GUESTBOOK_WRITES_ENABLED,
                detail: GUESTBOOK_WRITES_ENABLED ? 'Enabled' : 'Switched off in this prototype (GUESTBOOK_WRITES_ENABLED in src/lib/env.ts)',
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
