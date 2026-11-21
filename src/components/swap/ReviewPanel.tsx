import type { ReactNode } from 'react'
import { formatGwei } from 'viem'
import { useGasPrice } from 'wagmi'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import type { QuoteState } from '@/hooks/useQuote'
import { SLIPPAGE_OPTIONS, type SwapForm } from '@/hooks/useSwapForm'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { cn } from '@/lib/cn'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm tabular-nums text-ink-2">{children}</dd>
    </div>
  )
}

const FEE_LABEL: Record<string, string> = { provider: 'Service fee', gas: 'Estimated gas', swap: 'Swap fee', custom: 'App fee' }

const trim = (value: number) => Number(value.toPrecision(6)).toString()

/** Fee and transaction review: real numbers from the quote, and unknowns shown as unknown. */
export function ReviewPanel({ form, quote, locked }: { form: SwapForm; quote: QuoteState; locked: boolean }) {
  const { from, to, slippage, setSlippage, amount, amountState } = form
  const gas = useGasPrice({ chainId: ARC_CHAIN_ID, query: { refetchInterval: 15_000 } })
  const estimate = quote.estimate
  const route = estimate?.route

  const outAmount = estimate ? Number(estimate.estimatedOutput.amount) : undefined
  const inAmount = estimate ? Number(estimate.amountIn) : undefined
  const rate = outAmount !== undefined && inAmount ? outAmount / inAmount : undefined

  return (
    <Card className="space-y-2">
      <h2 className="display text-xl font-semibold text-ink">2. Review fees and details</h2>

      <dl className="divide-y divide-line">
        <Row label="You pay">{amountState === 'ok' ? `${amount} ${from.symbol}` : '—'}</Row>
        <Row label="You receive (estimate)">{estimate ? `${estimate.estimatedOutput.amount} ${to.symbol}` : `— ${to.symbol}`}</Row>
        <Row label="Effective rate">{rate !== undefined ? `1 ${from.symbol} ≈ ${trim(rate)} ${to.symbol}` : '—'}</Row>
        <Row label={`Minimum received (${slippage}% slippage)`}>
          {estimate ? `${estimate.stopLimit.amount} ${to.symbol}` : '—'}
        </Row>
        <Row label="Route">
          {route ? (
            <>
              <span className="block">{route.provider}</span>
              <span className="block text-xs text-subtle">
                {route.steps.map((step) => ('toolName' in step && typeof step.toolName === 'string' ? step.toolName : step.type)).join(' → ')}
              </span>
            </>
          ) : (
            '—'
          )}
        </Row>
        {estimate?.fees?.map((fee, index) => (
          <Row key={`${fee.type}-${index}`} label={FEE_LABEL[fee.type] ?? fee.type}>
            {fee.amount === null ? 'Unknown' : `${fee.amount} ${fee.token.toUpperCase() === 'CIRBTC' ? 'cirBTC' : fee.token}`}
          </Row>
        ))}
        {!estimate && <Row label="Fees">Shown with the quote</Row>}
        <Row label="Gas price now">
          {gas.isLoading ? (
            <span className="text-subtle">Loading…</span>
          ) : gas.isError || gas.data === undefined ? (
            <span className="text-danger">Unavailable</span>
          ) : (
            `${Number(formatGwei(gas.data)).toLocaleString('en-US', { maximumFractionDigits: 2 })} Gwei`
          )}
        </Row>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
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
              disabled={locked}
              onClick={() => setSlippage(option)}
              className={cn(
                'min-h-11 min-w-12 rounded-lg border px-3 text-xs font-semibold tabular-nums transition disabled:opacity-50',
                slippage === option ? 'border-accent/50 bg-accent/15 text-accent' : 'border-line text-muted hover:text-ink',
              )}
            >
              {option}%
            </button>
          ))}
        </div>
      </div>

      <Notice className="mt-3">
        Arc Testnet liquidity is thin and test prices are not market prices. Keep swaps small, and raise the tolerance if
        a swap fails.
      </Notice>
    </Card>
  )
}
