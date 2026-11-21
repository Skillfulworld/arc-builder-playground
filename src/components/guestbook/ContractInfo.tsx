import { AddressLink } from '@/components/ui/AddressLink'
import { Card, CardTitle } from '@/components/ui/Card'
import { explorerTxUrl } from '@/lib/arc'
import { GUESTBOOK_DEPLOYMENT } from '@/lib/deployments'
import { GUESTBOOK_ADDRESS } from '@/lib/env'
import { MAX_MESSAGE_LENGTH } from '@/lib/guestbook'
import { shortAddress } from '@/lib/format'

/** The deployed contract and its rules, for anyone who wants to check what they are writing to. */
export function ContractInfo() {
  return (
    <Card>
      <CardTitle>About the contract</CardTitle>
      <p className="mt-1 text-sm text-muted">A small, append-only contract deployed on Arc Testnet.</p>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-subtle">Address</dt>
          <dd>
            <AddressLink address={GUESTBOOK_ADDRESS} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-subtle">Deployment</dt>
          <dd>
            <a
              href={explorerTxUrl(GUESTBOOK_DEPLOYMENT.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs tabular-nums text-accent hover:underline"
            >
              {shortAddress(GUESTBOOK_DEPLOYMENT.txHash)}
            </a>
          </dd>
        </div>
      </dl>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-subtle">
        <li>Anyone can post. Messages cannot be edited or deleted.</li>
        <li>Each message is limited to {MAX_MESSAGE_LENGTH} characters, checked by the contract. Blank messages are rejected.</li>
        <li>No fees, no admin, no funds held. You only pay test USDC for gas.</li>
      </ul>
    </Card>
  )
}
