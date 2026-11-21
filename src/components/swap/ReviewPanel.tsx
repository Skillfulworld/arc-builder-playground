import { formatGwei } from 'viem'
import { useGasPrice } from 'wagmi'
import { Card } from '@/components/ui/Card'
import type { SwapForm } from '@/hooks/useSwapForm'
import { SLIPPAGE_OPTIONS } from '@/hooks/useSwapForm'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { cn } from '@/lib/cn'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-subtle">{label}</dt>
      <dd className="text-right text-sm tabular-nums text-ink-2">{children}</dd>
    </div>
  )
}

/** Fee and transaction review: everything the swap would do, with unknowns shown as unknown. */
export function ReviewPanel({ form }: { form: SwapForm }) {
  const { from, to, slippage, setSlippage, amount, amountState } = form
  const gas = useGasPrice({ chainId: ARC_CHAIN_ID, query: { refetchInterval: 15_000 } })

  return (
    <Card className="space-y-2">
      <h2 className="display text-xl font-semibold text-ink">2. Review fees and details</h2>

      <dl className="divide-y divide-line">
        <Row label="You pay">{amountState === 'ok' ? `${amount} ${from.symbol}` : '—'}</Row>
        <Row label="You receive (estimate)">{`— ${to.symbol}`}</Row>
        <Row label="Rate">—</Row>
        <Row label="Minimum received">
          <span className="block">—</span>
          <span className="block text-xs text-subtle">at {slippage}% slippage</span>
        </Row>
        <Row label="Route">Uniswap on Arc (pool not verified)</Row>
        <Row label="Gas price now">
          {gas.isLoading ? (
            <span className="text-subtle">Loading…</span>
          ) : gas.isError || gas.data === undefined ? (
            <span className="text-danger">Unavailable</span>
          ) : (
            `${Number(formatGwei(gas.data)).toLocaleString('en-US', { maximumFractionDigits: 2 })} Gwei`
          )}
        </Row>
        <Row label="Estimated network fee">
          <span className="block text-subtle">Known after a quote</span>
          <span className="block text-xs text-subtle">Paid in USDC on Arc</span>
        </Row>
      </dl>

      <div className="flex items-center justify-between gap-4 pt-3">
        <span id="slippage-label" className="text-sm text-subtle">
          Slippage tolerance
        </span>
        <div role="radiogroup" aria-labelledby="slippage-label" className="flex gap-1">
          {SLIPPAGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={slippage === option}
              onClick={() => setSlippage(option)}
              className={cn(
                'min-h-11 min-w-14 rounded-lg border px-3 text-xs font-semibold tabular-nums transition',
                slippage === option ? 'border-accent/50 bg-accent/15 text-accent' : 'border-line text-muted hover:text-ink',
              )}
            >
              {option}%
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
