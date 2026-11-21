import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import type { SwapForm } from '@/hooks/useSwapForm'
import { formatAmount, useUniswapPools, type UniswapQuoteState } from '@/hooks/useUniswap'
import { CIRBTC, USDC } from '@/lib/tokens'
import { feeLabel } from '@/lib/swapText'
import { virtualReserves, type PoolStatus, type TierQuote } from '@/lib/uniswap'

const STATUS: Record<PoolStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  live: { label: 'Live', tone: 'success' },
  empty: { label: 'No liquidity', tone: 'warning' },
  'not-initialized': { label: 'Not created', tone: 'neutral' },
}

function tierOutcome(tiers: TierQuote[] | undefined, fee: number, decimals: number): string {
  const tier = tiers?.find((t) => t.fee === fee)
  if (!tier) return '—'
  return tier.outcome === 'quoted' ? formatAmount(tier.amountOut, decimals) : 'Cannot fill'
}

/** Which Uniswap v4 pools exist for the pair at the standard fee tiers, and how deep they are. */
export function PoolsCard({ form, quote }: { form: SwapForm; quote: UniswapQuoteState }) {
  const pools = useUniswapPools(USDC.address, CIRBTC.address)
  const tiers =
    quote.result?.kind === 'ok'
      ? quote.result.quote.tiers
      : quote.result?.kind === 'insufficient-liquidity'
        ? quote.result.tiers
        : undefined
  const live = pools.data?.find((pool) => pool.status === 'live')
  const reserves = live ? virtualReserves(live) : undefined
  const usdcIsCurrency0 = live ? live.key.currency0.toLowerCase() === USDC.address.toLowerCase() : true
  const depth = reserves
    ? {
        usdcRaw: usdcIsCurrency0 ? reserves.amount0Raw : reserves.amount1Raw,
        cirbtcRaw: usdcIsCurrency0 ? reserves.amount1Raw : reserves.amount0Raw,
      }
    : undefined

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>Available pools</CardTitle>
        <p className="mt-1 text-sm text-muted">Uniswap v4 pools for USDC and cirBTC, read from Arc Testnet.</p>
      </div>

      {pools.isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading pools">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : pools.isError || !pools.data ? (
        <Notice tone="danger">Could not read pools from Arc Testnet. Refresh the page to try again.</Notice>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.06em] text-subtle">
              <tr>
                <th className="py-2 pr-3 font-medium">Fee tier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 text-right font-medium">Liquidity (L)</th>
                <th className="py-2 text-right font-medium">Quote ({form.to.symbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pools.data.map((pool) => (
                <tr key={pool.key.fee}>
                  <td className="py-3 pr-3 font-semibold text-ink">{feeLabel(pool.key.fee)}</td>
                  <td className="py-3 pr-3">
                    <Badge tone={STATUS[pool.status].tone}>{STATUS[pool.status].label}</Badge>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums text-ink-2">{pool.liquidity.toLocaleString('en-US')}</td>
                  <td className="py-3 text-right tabular-nums text-ink-2">
                    {pool.status === 'live' ? tierOutcome(tiers, pool.key.fee, form.to.decimals) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {depth && (
        <p className="text-pretty text-sm text-muted">
          Rough depth of the live pool near its current price (an estimate): about{' '}
          <span className="tabular-nums text-ink-2">{formatAmount(BigInt(Math.round(depth.usdcRaw)), USDC.decimals)} USDC</span> and{' '}
          <span className="tabular-nums text-ink-2">{formatAmount(BigInt(Math.round(depth.cirbtcRaw)), CIRBTC.decimals)} cirBTC</span>.
          That is small, so bigger swaps move the price a lot.
        </p>
      )}

      <p className="text-pretty text-xs text-subtle">
        Only the four standard hookless fee tiers are checked. Pools that use hooks are not discovered here. Liquidity (L)
        is a Uniswap unit, not a dollar value.
      </p>
    </Card>
  )
}
