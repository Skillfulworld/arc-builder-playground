import { ArrowDownUp, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { QuoteState, QuoteStatus } from '@/hooks/useQuote'
import type { SwapForm } from '@/hooks/useSwapForm'
import { cn } from '@/lib/cn'
import { formatTokenAmount } from '@/lib/format'
import { TokenSelect } from './TokenSelect'

interface SwapCardProps {
  form: SwapForm
  quote: QuoteState
  locked: boolean
}

const QUOTE_BADGE: Record<QuoteStatus, { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  idle: { label: 'Waiting for amount', tone: 'neutral' },
  'need-wallet': { label: 'Connect wallet', tone: 'neutral' },
  'wrong-network': { label: 'Wrong network', tone: 'warning' },
  loading: { label: 'Fetching quote', tone: 'neutral' },
  ready: { label: 'Live quote', tone: 'success' },
  error: { label: 'No quote', tone: 'danger' },
}

/** Token selection, amount input and the quote / estimated output area. */
export function SwapCard({ form, quote, locked }: SwapCardProps) {
  const { isConnected } = useAccount()
  const { from, to, balance, amountState } = form
  const badge = QUOTE_BADGE[quote.status]
  const output = quote.estimate?.estimatedOutput.amount

  return (
    <Card strong className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="display text-xl font-semibold text-ink">1. Choose and enter</h2>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Arc Testnet</span>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-subtle">
          <label htmlFor="swap-amount" className="font-medium uppercase tracking-[0.08em]">
            You pay
          </label>
          <span className="tabular-nums">
            {!isConnected
              ? 'Balance: connect wallet'
              : balance.isLoading
                ? 'Balance: loading…'
                : balance.isError
                  ? 'Balance: unavailable'
                  : `Balance: ${formatTokenAmount(balance.data ?? 0n, from.decimals, 6)} ${from.symbol}`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="swap-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={form.amount}
            disabled={locked}
            onChange={(event) => form.onAmountChange(event.target.value)}
            aria-invalid={amountState === 'insufficient' || amountState === 'invalid'}
            aria-describedby="swap-amount-help"
            className="display min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums text-ink outline-none disabled:opacity-60 sm:text-4xl"
          />
          <TokenSelect label="Pay with" value={from.symbol} onChange={form.selectFrom} />
        </div>
        <p id="swap-amount-help" className="mt-2 min-h-5 text-sm" aria-live="polite">
          {amountState === 'insufficient' && <span className="text-danger">Amount exceeds your {from.symbol} balance.</span>}
          {amountState === 'invalid' && <span className="text-danger">Enter an amount greater than zero.</span>}
          {amountState !== 'insufficient' && amountState !== 'invalid' && from.symbol === 'USDC' && (
            <span className="text-subtle">USDC also pays gas on Arc, so keep a little aside.</span>
          )}
        </p>
      </div>

      <div className="relative z-10 -my-5 flex justify-center">
        <button
          type="button"
          onClick={form.flip}
          disabled={locked}
          aria-label="Reverse the pair"
          className="grid size-11 place-items-center rounded-xl border border-line bg-surface-muted text-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          <ArrowDownUp className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">You receive (estimate)</span>
          <div className="flex items-center gap-2">
            {quote.status === 'ready' && (
              <button
                type="button"
                onClick={quote.refetch}
                disabled={locked || quote.refreshing}
                aria-label="Refresh quote"
                className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-surface hover:text-ink disabled:opacity-50"
              >
                <RefreshCw className={cn('size-3.5', quote.refreshing && 'animate-spin')} />
              </button>
            )}
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {quote.status === 'loading' ? (
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface" aria-busy="true" aria-label="Fetching quote" />
          ) : (
            <p
              className={cn(
                'display min-w-0 flex-1 break-words text-3xl font-semibold tabular-nums sm:text-4xl',
                output ? 'text-ink' : 'text-subtle',
              )}
            >
              {output ?? '—'}
            </p>
          )}
          <TokenSelect label="Receive" value={to.symbol} onChange={form.selectTo} />
        </div>
        <p
          className={cn('mt-2 text-pretty text-sm', quote.status === 'error' ? 'text-danger' : 'text-muted')}
          aria-live="polite"
        >
          {quote.reason}
        </p>
      </div>
    </Card>
  )
}
