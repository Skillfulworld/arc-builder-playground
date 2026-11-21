import type { ReactNode } from 'react'
import { formatUnits } from 'viem'
import { useGasPrice } from 'wagmi'
import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import type { SwapForm } from '@/hooks/useSwapForm'
import type { UniswapQuoteState } from '@/hooks/useUniswap'
import { formatAmount } from '@/hooks/useUniswap'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { cn } from '@/lib/cn'
import { shortAddress } from '@/lib/format'
import { feeLabel, IMPACT_TEXT_CLASS, impactLevel, percent } from '@/lib/swapText'
import { IMPACT_BLOCK, IMPACT_WARN } from '@/lib/uniswap'

const GAS_FLOOR = 20_000_000_000n // Arc never prices gas below 20 gwei

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm tabular-nums text-ink-2">{children}</dd>
    </div>
  )
}

/** Fees, price impact and pool facts for the quote on screen. Every figure is read or computed from chain data. */
export function QuoteDetails({ form, quote }: { form: SwapForm; quote: UniswapQuoteState }) {
  const gas = useGasPrice({ chainId: ARC_CHAIN_ID, query: { refetchInterval: 15_000 } })
  const ok = quote.result?.kind === 'ok' ? quote.result.quote : undefined
  const { from, to } = form

  if (!ok) {
    return (
      <Card>
        <CardTitle>Quote details</CardTitle>
        <p className="mt-2 text-sm text-muted">Fees, price impact and pool facts appear here once a quote is available.</p>
      </Card>
    )
  }

  const level = impactLevel(ok.priceImpact)
  const humanScale = 10 ** (from.decimals - to.decimals)
  const mid = ok.midPriceRaw * humanScale
  const effective = (Number(ok.amountOut) / Number(ok.amountIn)) * humanScale
  const feePaid = (Number(ok.amountIn) * ok.feeFraction) / 10 ** from.decimals
  const gasPrice = gas.data !== undefined && gas.data > GAS_FLOOR ? gas.data : GAS_FLOOR
  const gasCost = formatUnits(ok.gasUnits * gasPrice, 18)
  const prec = (n: number) => Number(n.toPrecision(6)).toString()

  return (
    <Card className="space-y-3">
      <CardTitle>Quote details</CardTitle>
      <dl className="divide-y divide-line">
        <Row label="Pool">
          Uniswap v4 · {feeLabel(ok.pool.key.fee)} fee tier
          <span className="block text-xs text-subtle">No hooks · id {shortAddress(ok.pool.poolId)}</span>
        </Row>
        <Row label="Pool fee">
          {percent(ok.feeFraction)}
          <span className="block text-xs text-subtle">
            about {prec(feePaid)} {from.symbol}, paid to liquidity providers
          </span>
        </Row>
        <Row label="Price impact">
          <span className={cn('font-semibold', IMPACT_TEXT_CLASS[level])}>{percent(ok.priceImpact)}</span>
          <span className="block text-xs text-subtle">Compared with the pool mid price, fee excluded</span>
        </Row>
        <Row label="Pool mid price">
          1 {from.symbol} = {prec(mid)} {to.symbol}
        </Row>
        <Row label="Price you would get">
          1 {from.symbol} ≈ {prec(effective)} {to.symbol}
        </Row>
        <Row label="Estimated minimum output">
          Not set
          <span className="block text-xs text-subtle">Slippage limits only apply to a real swap</span>
        </Row>
        <Row label="Swap gas (estimate)">
          {ok.gasUnits.toLocaleString('en-US')} gas
          <span className="block text-xs text-subtle">
            about {formatAmount(BigInt(Math.round(Number(gasCost) * 1e6)), 6)} USDC at the current gas price, approval not included
          </span>
        </Row>
      </dl>

      {level === 'warn' && (
        <Notice tone="warning">
          Price impact is above {percent(IMPACT_WARN)}. This pool is small, so your trade moves its price noticeably.
        </Notice>
      )}
      {level === 'high' && (
        <Notice tone="danger">
          Price impact is above {percent(IMPACT_BLOCK)}. A real swap would be blocked at this size. Try a smaller amount.
        </Notice>
      )}
    </Card>
  )
}
