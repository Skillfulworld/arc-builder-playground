import { MessageSquareDashed } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { addressHue, shortAddress, timeAgo } from '@/lib/format'
import { useGuestbookMessages } from '@/hooks/useGuestbook'

function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  )
}

export function MessageList({ guestbook }: { guestbook: ReturnType<typeof useGuestbookMessages> }) {
  const { enabled, messages, total, isLoading, isError } = guestbook

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
        <Notice tone="danger">Could not read messages from Arc Testnet. Refresh to try again.</Notice>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
          No messages yet. Be the first to sign.
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((message, index) => (
            <li key={`${message.author}-${message.timestamp}-${index}`} className="rounded-2xl border border-line bg-canvas/40 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="size-8 shrink-0 rounded-full"
                  style={{ background: `hsl(${addressHue(message.author)} 55% 62%)` }}
                  aria-hidden
                />
                <span className="mono text-sm tabular-nums text-ink-2">{shortAddress(message.author)}</span>
                <span className="ml-auto text-xs text-subtle">{timeAgo(Number(message.timestamp))}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-pretty text-base text-ink">{message.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
