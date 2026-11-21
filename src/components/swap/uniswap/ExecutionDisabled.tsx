import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useUniswapDeployment } from '@/hooks/useUniswap'
import { V4 } from '@/lib/uniswap'
import { AddressLink } from '@/components/ui/AddressLink'

const REMAINING = [
  'A supported swap router on Arc Testnet. Uniswap\'s current Universal Router (2.1.2) has no code there, and the older 2.1.1 is past end of support.',
  'A token approval flow: allow Permit2 to spend the token, then sign a permit for the router.',
  'Swap calldata with a deadline and a minimum output taken from a fresh quote, simulated before sending.',
  'Safety gates: block above 5% price impact, cap slippage, and show gas for approval plus swap.',
  'A decision that an unsupported testnet pool is acceptable for real transactions, or a pool you control for testing.',
]

/** Step 3: the swap is intentionally off. Lists exactly what would be needed to turn it on. */
export function ExecutionDisabled() {
  const deployment = useUniswapDeployment()

  return (
    <Card strong className="space-y-4 border-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-xl font-semibold text-ink">3. Approve and swap</h2>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Disabled</span>
      </div>

      <Button disabled className="w-full">
        Approvals and swaps are off in this demo
      </Button>

      <div>
        <p className="text-sm font-semibold text-ink">What real execution would still need</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-pretty text-sm text-muted marker:text-subtle">
          {REMAINING.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-subtle">Quoter used for estimates</span>
          <AddressLink address={V4.quoter} />
        </div>
        <p className="text-pretty text-xs text-subtle">
          {deployment.isLoading
            ? 'Checking the Quoter on Arc Testnet…'
            : deployment.data?.quoterDeployed && deployment.data.rolesMatch
              ? 'Verified live: the Quoter has code on Arc Testnet and points at the expected PoolManager.'
              : 'Could not verify the Quoter on Arc Testnet right now, so quotes may be unavailable.'}{' '}
          Uniswap does not list Arc Testnet as a supported network, so this is an educational read-only view.
        </p>
      </div>
    </Card>
  )
}
