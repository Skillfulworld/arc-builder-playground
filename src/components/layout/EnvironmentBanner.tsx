import { ShieldCheck } from 'lucide-react'
import { SWAP_ENABLED } from '@/lib/env'

/** Always-visible environment statement: testnet only, and whether transactions are possible. */
export function EnvironmentBanner() {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2 text-xs text-muted sm:items-center sm:px-6">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent sm:mt-0" aria-hidden />
        <p className="text-pretty">
          <span className="font-semibold text-ink-2">Testnet environment.</span> Arc Testnet with test USDC only; Arc
          mainnet is never used.{' '}
          {SWAP_ENABLED
            ? 'The Guestbook and the Testnet swap send Arc Testnet transactions, and your wallet asks you to approve each one.'
            : 'Transactions are switched off at this stage, so nothing can be sent.'}
        </p>
      </div>
    </div>
  )
}
