import { Card, CardTitle } from '@/components/ui/Card'
import { MAX_MESSAGE_LENGTH } from '@/lib/guestbook'

const INTERFACE = `addMessage(string text) -> id
messageCount() -> uint256
getMessage(id) -> Message
getMessages(offset, limit) -> Message[]

Message { author, timestamp, text }
event MessageAdded(id, author, timestamp, text)`

/** Explains the planned contract so builders see the design before it is written. */
export function ContractPlan() {
  return (
    <Card>
      <CardTitle>Planned contract</CardTitle>
      <p className="mt-1 text-sm text-muted">A small, append-only contract that is written, reviewed and tested. It is not deployed yet.</p>
      <pre className="mono mt-4 overflow-x-auto rounded-2xl border border-line bg-canvas/50 p-4 text-xs leading-relaxed text-ink-2">
        {INTERFACE}
      </pre>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-subtle">
        <li>Anyone can post. Messages cannot be edited or deleted.</li>
        <li>Each message is limited to {MAX_MESSAGE_LENGTH} characters, checked by the contract. Blank messages are rejected.</li>
        <li>No fees, no admin, no funds held.</li>
      </ul>
    </Card>
  )
}
