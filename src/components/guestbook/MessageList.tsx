import { ExternalLink, MessageSquareDashed } from 'lucide-react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { AddressLink } from '@/components/ui/AddressLink'
import { Notice } from '@/components/ui/Notice'
import type { useGuestbookMessages } from '@/hooks/useGuestbook'
import type { PublishState } from '@/hooks/usePublishMessage'
import { explorerTxUrl } from '@/lib/arc'
import { addressHue, timeAgo } from '@/lib/format'

function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  )
}

interface EntryProps {
  author: Address
  text: string
  when: string
  isYou: boolean
  status: React.ReactNode
  footer?: React.ReactNode
}

function Entry({ author, text, when, isYou, status, footer }: EntryProps) {
  return (
    <li className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="size-8 shrink-0 rounded-full" style={{ background: `hsl(${addressHue(author)} 55% 62%)` }} aria-hidden />
        <AddressLink address={author} />
        {isYou && <Badge tone="accent">You</Badge>}
        <span className="ml-auto text-xs text-subtle">{when}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-pretty text-base text-ink">{text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status}
        {footer}
      </div>
    </li>
  )
}

interface MessageListProps {
  guestbook: ReturnType<typeof useGuestbookMessages>
  publish: PublishState
}

export function MessageList({ guestbook, publish }: MessageListProps) {
  const { address } = useAccount()
  const { enabled, messages, total, isLoading, isError } = guestbook

  const inFlight = publish.status === 'awaiting-wallet' || publish.status === 'confirming'
  const pendingText = typeof publish.pendingText === 'string' ? publish.pendingText : undefined
  const showPending = inFlight && pendingText !== undefined && publish.author !== undefined
  const isEmpty = !isLoading && !isError && messages.length === 0 && !showPending

  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle className="text-xl">Recent messages</CardTitle>
        {enabled && !isLoading && <span className="text-sm tabular-nums text-subtle">{total.toString()} total</span>}
      </div>

      {!enabled ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <MessageSquareDashed className="size-8 text-subtle" aria-hidden />
          <p className="text-sm font-semibold text-ink">No guestbook contract connected</p>
          <p className="max-w-sm text-pretty text-sm text-muted">
            Messages will appear here, read directly from the chain, once the contract is deployed and its address is set.
          </p>
        </div>
      ) : isLoading ? (
        <Skeleton />
      ) : isError ? (
        <Notice tone="danger">Could not read messages from Arc Testnet. Refresh the page to try again.</Notice>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
          No messages yet. Be the first to sign.
        </div>
      ) : (
        <ul className="space-y-3">
          {showPending && publish.author && (
            <Entry
              author={publish.author}
              text={pendingText}
              when="now"
              isYou
              status={
                <Badge tone="warning">{publish.status === 'awaiting-wallet' ? 'Waiting for wallet' : 'Confirming'}</Badge>
              }
              footer={
                publish.hash ? (
                  <a
                    href={explorerTxUrl(publish.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    View transaction <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null
              }
            />
          )}
          {messages.map((message, index) => (
            <Entry
              key={`${message.author}-${message.timestamp}-${index}`}
              author={message.author}
              text={message.text}
              when={timeAgo(Number(message.timestamp))}
              isYou={address?.toLowerCase() === message.author.toLowerCase()}
              status={<Badge tone="success">Confirmed onchain</Badge>}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
