import { Badge } from '@/components/ui/Badge'
import { AddressLink } from '@/components/ui/AddressLink'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import { TestnetGuide } from '@/components/layout/TestnetGuide'
import { useGuestbookMessages } from '@/hooks/useGuestbook'
import { useInjectedWallet } from '@/hooks/useInjectedWallet'
import { usePublishMessage } from '@/hooks/usePublishMessage'
import { GUESTBOOK_ADDRESS, GUESTBOOK_WRITES_ENABLED } from '@/lib/env'
import { ContractInfo } from './ContractInfo'
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
        description="Connect a wallet, publish a public message, and read what others left. Every message lives in a smart contract on Arc Testnet, not on a server."
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Live on Arc Testnet</Badge>
            <AddressLink address={GUESTBOOK_ADDRESS} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <MessageForm publish={publish} onPosted={guestbook.refetch} />
          <ContractInfo />
        </div>
        <div className="space-y-6">
          <MessageList guestbook={guestbook} publish={publish} />
          <SetupChecklist
            title="Setup status"
            items={[
              wallet,
              {
                label: 'Guestbook contract on Arc Testnet',
                ready: !guestbook.isError && !guestbook.isLoading,
                detail: guestbook.isError ? 'Could not read the contract' : guestbook.isLoading ? 'Reading the contract…' : 'Read from the deployed contract',
              },
              {
                label: 'Publishing',
                ready: GUESTBOOK_WRITES_ENABLED,
                detail: GUESTBOOK_WRITES_ENABLED ? 'Enabled: your wallet approves every message' : 'Switched off in this build',
              },
            ]}
          />
        </div>
      </div>

      <TestnetGuide />
    </div>
  )
}
