import { ArrowDownUp } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { QuoteStatus } from '@/hooks/useQuote'
import type { SwapForm } from '@/hooks/useSwapForm'
import { formatTokenAmount } from '@/lib/format'
import { TokenSelect } from './TokenSelect'

interface SwapCardProps {
  form: SwapForm
  quote: { status: QuoteStatus; reason: string }
}

const QUOTE_BADGE: Record<QuoteStatus, { label: string; tone: 'neutral' | 'warning' }> = {
  idle: { label: 'Waiting for amount', tone: 'neutral' },
  unconfigured: { label: 'Quote unavailable', tone: 'warning' },
  unavailable: { label: 'Quote unavailable', tone: 'warning' },
}

/** Token selection, amount input and the quote / estimated output area. */
export function SwapCard({ form, quote }: SwapCardProps) {
  const { isConnected } = useAccount()
  const { from, to, balance, amountState } = form
  const badge = QUOTE_BADGE[quote.status]

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
                  : `Balance: ${formatTokenAmount(balance.data ?? 0n, from.decimals, 4)} ${from.symbol}`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="swap-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => form.onAmountChange(event.target.value)}
            aria-invalid={amountState === 'insufficient' || amountState === 'invalid'}
            aria-describedby="swap-amount-help"
            className="display min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums text-ink outline-none sm:text-4xl"
          />
          <TokenSelect label="Pay with" value={from.symbol} onChange={form.selectFrom} />
        </div>
        <p id="swap-amount-help" className="mt-2 min-h-5 text-sm" aria-live="polite">
          {amountState === 'insufficient' && <span className="text-danger">Amount exceeds your {from.symbol} balance.</span>}
          {amountState === 'invalid' && <span className="text-danger">Enter an amount greater than zero.</span>}
        </p>
      </div>

      <div className="relative z-10 -my-5 flex justify-center">
        <button
          type="button"
          onClick={form.flip}
          aria-label="Reverse the pair"
          className="grid size-11 place-items-center rounded-xl border border-line bg-surface-muted text-muted transition hover:border-line-strong hover:text-ink"
        >
          <ArrowDownUp className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">You receive (estimate)</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <p className="display min-w-0 flex-1 text-3xl font-semibold tabular-nums text-subtle sm:text-4xl" aria-label="No quote available">
            —
          </p>
          <TokenSelect label="Receive" value={to.symbol} onChange={form.selectTo} />
        </div>
        <p className="mt-2 text-pretty text-sm text-muted" aria-live="polite">
          {quote.reason}
        </p>
      </div>
    </Card>
  )
}
