import { ArrowDownUp, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { useNow } from '@/hooks/useNow'
import type { SwapForm } from '@/hooks/useSwapForm'
import { formatAmount, type UniswapQuoteState, type UniswapQuoteStatus } from '@/hooks/useUniswap'
import { cn } from '@/lib/cn'
import { formatTokenAmount } from '@/lib/format'
import { TokenSelect } from '../TokenSelect'

const STALE_AFTER_MS = 30_000

const BADGE: Record<UniswapQuoteStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = {
  idle: { label: 'Waiting for amount', tone: 'neutral' },
  loading: { label: 'Fetching quote', tone: 'neutral' },
  ready: { label: 'Live estimate', tone: 'success' },
  'no-route': { label: 'No route', tone: 'warning' },
  'insufficient-liquidity': { label: 'Not enough liquidity', tone: 'warning' },
  error: { label: 'Error', tone: 'danger' },
}

function statusLine(status: UniswapQuoteStatus, form: SwapForm): { text: string; tone: 'muted' | 'danger' } {
  switch (status) {
    case 'idle':
      return { text: 'Enter an amount to request a quote.', tone: 'muted' }
    case 'loading':
      return { text: 'Asking the Uniswap v4 Quoter on Arc Testnet…', tone: 'muted' }
    case 'no-route':
      return {
        text: `No live Uniswap pool for ${form.from.symbol} and ${form.to.symbol} was found at the standard fee tiers.`,
        tone: 'muted',
      }
    case 'insufficient-liquidity':
      return {
        text: `The pools cannot fill ${form.amount} ${form.from.symbol}. Try a smaller amount.`,
        tone: 'muted',
      }
    case 'error':
      return { text: 'Could not read from Arc Testnet. Check your connection and request a fresh quote.', tone: 'danger' }
    default:
      return { text: '', tone: 'muted' }
  }
}

/** Amount entry, token choice and the live Uniswap estimate. Read-only: nothing here sends a transaction. */
export function UniswapQuoteCard({ form, quote }: { form: SwapForm; quote: UniswapQuoteState }) {
  const { isConnected } = useAccount()
  const now = useNow()
  const { from, to, balance, amountState } = form
  const ok = quote.result?.kind === 'ok' ? quote.result.quote : undefined
  const badge = BADGE[quote.status]
  const line = statusLine(quote.status, form)
  const ageMs = ok ? now - ok.fetchedAt : 0
  const stale = ok !== undefined && ageMs > STALE_AFTER_MS

  return (
    <Card strong className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="display text-xl font-semibold text-ink">1. Ask for a quote</h2>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Arc Testnet</span>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-subtle">
          <label htmlFor="uni-amount" className="font-medium uppercase tracking-[0.08em]">
            You would pay
          </label>
          <span className="tabular-nums">
            {isConnected && balance.data !== undefined
              ? `Balance: ${formatTokenAmount(balance.data, from.decimals, 6)} ${from.symbol}`
              : 'Wallet optional for quotes'}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="uni-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => form.onAmountChange(event.target.value)}
            aria-invalid={amountState === 'invalid'}
            className="display min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums text-ink outline-none sm:text-4xl"
          />
          <TokenSelect label="Pay with" value={from.symbol} onChange={form.selectFrom} />
        </div>
        {amountState === 'invalid' && <p className="mt-2 text-sm text-danger">Enter an amount greater than zero.</p>}
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
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">You would receive (estimate)</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {quote.status === 'loading' ? (
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface" aria-busy="true" aria-label="Fetching quote" />
          ) : (
            <p
              className={cn(
                'display min-w-0 flex-1 break-words text-3xl font-semibold tabular-nums sm:text-4xl',
                ok ? 'text-ink' : 'text-subtle',
              )}
            >
              {ok ? formatAmount(ok.amountOut, to.decimals) : '—'}
            </p>
          )}
          <TokenSelect label="Receive" value={to.symbol} onChange={form.selectTo} />
        </div>
        <p
          className={cn('mt-2 text-pretty text-sm', line.tone === 'danger' ? 'text-danger' : 'text-muted')}
          aria-live="polite"
        >
          {ok
            ? `Quoted at block #${ok.blockNumber.toLocaleString('en-US')}, ${Math.max(0, Math.round(ageMs / 1000))}s ago.${stale ? ' This quote may be out of date: request a fresh one.' : ''}`
            : line.text}
        </p>
      </div>

      <Button
        onClick={quote.refresh}
        disabled={quote.status === 'idle'}
        loading={quote.fetching}
        className="w-full"
      >
        <RefreshCw className="size-4" aria-hidden />
        Get fresh quote
      </Button>

      <Notice tone="warning">
        A quote is an estimate, not a promise. The pool changes with every trade, so the real result can differ, and a
        quote goes stale within seconds.
      </Notice>
    </Card>
  )
}
