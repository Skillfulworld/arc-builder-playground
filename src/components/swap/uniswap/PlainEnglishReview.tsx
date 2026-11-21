import { CircleSlash } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { SwapForm } from '@/hooks/useSwapForm'
import { formatAmount, type UniswapQuoteState } from '@/hooks/useUniswap'
import { feeLabel, impactLevel, percent } from '@/lib/swapText'

/** Step 2: the proposed swap explained in everyday language, built only from the current quote. */
export function PlainEnglishReview({ form, quote }: { form: SwapForm; quote: UniswapQuoteState }) {
  const ok = quote.result?.kind === 'ok' ? quote.result.quote : undefined
  const { from, to } = form

  return (
    <Card className="space-y-4">
      <h2 className="display text-xl font-semibold text-ink">2. Review in plain English</h2>

      {!ok ? (
        <p className="text-pretty text-sm text-muted">
          Get a quote first. This section then explains what the swap would do, step by step, in simple terms.
        </p>
      ) : (
        <ul className="space-y-3.5 text-pretty text-sm text-ink-2">
          <li>
            <span className="font-semibold text-ink">What you asked for. </span>
            Trade {formatAmount(ok.amountIn, from.decimals)} {from.symbol} for {to.symbol} using Uniswap, an automated
            exchange where people put tokens into shared pools.
          </li>
          <li>
            <span className="font-semibold text-ink">What you would get. </span>
            About {formatAmount(ok.amountOut, to.decimals)} {to.symbol}, based on the {feeLabel(ok.pool.key.fee)} pool as of
            block #{ok.blockNumber.toLocaleString('en-US')}.
          </li>
          <li>
            <span className="font-semibold text-ink">What it costs. </span>
            The pool keeps a {percent(ok.feeFraction)} fee for the people who supplied its tokens. On top of that, the
            network charges a small gas fee in USDC.
          </li>
          <li>
            <span className="font-semibold text-ink">How much you move the price. </span>
            Your trade shifts this pool&apos;s price by about {percent(ok.priceImpact)}.{' '}
            {impactLevel(ok.priceImpact) === 'low'
              ? 'That is small.'
              : impactLevel(ok.priceImpact) === 'warn'
                ? 'That is noticeable because the pool holds little money, so a smaller amount would get a better price.'
                : 'That is large because the pool holds very little money. A real swap would be blocked at this size, and a smaller amount would get a much better price.'}
          </li>
          <li>
            <span className="font-semibold text-ink">Why it can change. </span>
            Prices move whenever anyone trades. By the time a real swap went through, the result could be better or worse
            than this estimate.
          </li>
        </ul>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-sm text-muted">
        <CircleSlash className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
        <p className="text-pretty">
          <span className="font-semibold text-ink-2">Nothing will be sent. </span>
          In this demo, approving tokens and swapping are switched off. You can only look.
        </p>
      </div>
    </Card>
  )
}
