import { Card, CardTitle } from '@/components/ui/Card'
import { MAX_MESSAGE_BYTES } from '@/lib/guestbook'

const INTERFACE = `postMessage(string text)
messageCount() -> uint256
getMessages(offset, limit) -> Message[]

Message { author, timestamp, text }`

/** Explains the planned contract so builders see the design before it is written. */
export function ContractPlan() {
  return (
    <Card>
      <CardTitle>Planned contract</CardTitle>
      <p className="mt-1 text-sm text-muted">A small, append-only contract. Nothing is deployed yet.</p>
      <pre className="mono mt-4 overflow-x-auto rounded-2xl border border-line bg-canvas/50 p-4 text-xs leading-relaxed text-ink-2">
        {INTERFACE}
      </pre>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-subtle">
        <li>Anyone can post. Messages cannot be edited or deleted.</li>
        <li>Each message is limited to {MAX_MESSAGE_BYTES} bytes, checked by the contract.</li>
        <li>No fees, no admin, no funds held.</li>
      </ul>
    </Card>
  )
}
