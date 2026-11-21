import type { ReactNode } from 'react'
import { ExternalLink, MessageSquareDashed } from 'lucide-react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { AddressLink } from '@/components/ui/AddressLink'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
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

const exactTime = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

interface EntryProps {
  author: Address
  text: string
  /** Pre-formatted time, shown with the exact time as a tooltip when available. */
  when: ReactNode
  whenTitle?: string
  idLabel?: string
  isYou: boolean
  status: ReactNode
  footer?: ReactNode
}

function Entry({ author, text, when, whenTitle, idLabel, isYou, status, footer }: EntryProps) {
  return (
    <li className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="size-8 shrink-0 rounded-full" style={{ background: `hsl(${addressHue(author)} 55% 62%)` }} aria-hidden />
        <AddressLink address={author} />
        {isYou && <Badge tone="accent">You</Badge>}
        <span className="ml-auto text-xs tabular-nums text-subtle" title={whenTitle}>
          {idLabel && <span className="mr-2">{idLabel}</span>}
          {when}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-pretty text-base text-ink">{text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status}
        {footer}
      </div>
    </li>
  )
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
    >
      View transaction <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}

interface MessageListProps {
  guestbook: ReturnType<typeof useGuestbookMessages>
  publish: PublishState
}

export function MessageList({ guestbook, publish }: MessageListProps) {
  const { address } = useAccount()
  const { entries, total, isLoading, isError, txHashes, txLookupFailed } = guestbook

  const inFlight = publish.status === 'awaiting-wallet' || publish.status === 'confirming'
  const pendingText = typeof publish.pendingText === 'string' ? publish.pendingText : undefined
  const showPending = inFlight && pendingText !== undefined && publish.author !== undefined
  const isEmpty = !isLoading && !isError && entries.length === 0 && !showPending

  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle className="text-xl">Recent messages</CardTitle>
        {!isLoading && !isError && <span className="text-sm tabular-nums text-subtle">{total.toString()} total</span>}
      </div>

      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <Notice tone="danger">Could not read messages from the contract on Arc Testnet. Refresh the page to try again.</Notice>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
          <MessageSquareDashed className="size-8 text-subtle" aria-hidden />
          <p className="text-sm font-semibold text-ink">No messages yet</p>
          <p className="max-w-sm text-pretty text-sm text-muted">Be the first to sign. Your message will be stored in the contract.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {showPending && publish.author && (
            <Entry
              author={publish.author}
              text={pendingText}
              when="now"
              isYou
              status={<Badge tone="warning">{publish.status === 'awaiting-wallet' ? 'Waiting for wallet' : 'Confirming'}</Badge>}
              footer={publish.hash ? <TxLink hash={publish.hash} /> : null}
            />
          )}
          {entries.map(({ id, message }) => {
            const hash = txHashes?.[id.toString()]
            const seconds = Number(message.timestamp)
            return (
              <Entry
                key={id.toString()}
                author={message.author}
                text={message.text}
                idLabel={`#${id.toString()}`}
                when={timeAgo(seconds)}
                whenTitle={exactTime(seconds)}
                isYou={address?.toLowerCase() === message.author.toLowerCase()}
                status={<Badge tone="success">Confirmed onchain</Badge>}
                footer={
                  hash ? (
                    <TxLink hash={hash} />
                  ) : (
                    <span className="text-xs text-subtle">
                      {txLookupFailed ? 'Transaction link unavailable' : 'Looking up transaction…'}
                    </span>
                  )
                }
              />
            )
          })}
        </ul>
      )}
    </Card>
  )
}
