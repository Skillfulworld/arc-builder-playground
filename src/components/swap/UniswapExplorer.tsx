import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import type { SwapForm } from '@/hooks/useSwapForm'
import { useTokenInfo } from '@/hooks/useToken'
import { useUniswapDeployment, useUniswapPools, useUniswapQuote } from '@/hooks/useUniswap'
import { CIRBTC, USDC } from '@/lib/tokens'
import { TokenFactCard } from './TokenFactCard'
import { ExecutionDisabled } from './uniswap/ExecutionDisabled'
import { PlainEnglishReview } from './uniswap/PlainEnglishReview'
import { PoolsCard } from './uniswap/PoolsCard'
import { QuoteDetails } from './uniswap/QuoteDetails'
import { UniswapQuoteCard } from './uniswap/UniswapQuoteCard'

function useChecklist() {
  const usdc = useTokenInfo(USDC.address)
  const cirbtc = useTokenInfo(CIRBTC.address)
  const deployment = useUniswapDeployment()
  const pools = useUniswapPools(USDC.address, CIRBTC.address)

  const deployed = Boolean(deployment.data?.quoterDeployed && deployment.data.stateViewDeployed && deployment.data.rolesMatch)
  const livePools = pools.data?.filter((pool) => pool.status === 'live').length ?? 0

  return [
    {
      label: 'USDC and cirBTC tokens',
      ready: usdc.decimals === USDC.decimals && cirbtc.decimals === CIRBTC.decimals,
      detail: 'Decimals read from chain (6 and 8)',
    },
    {
      label: 'Uniswap v4 Quoter on Arc Testnet',
      ready: deployed,
      detail: deployment.isLoading ? 'Checking…' : deployed ? 'Code present, PoolManager matches' : 'Not verified: quotes may be unavailable',
    },
    {
      label: 'Live USDC/cirBTC pool',
      ready: livePools > 0,
      detail: pools.isLoading ? 'Checking…' : `${livePools} of 4 standard fee tiers have liquidity`,
    },
    {
      label: 'Approvals and swap execution',
      ready: false,
      detail: 'Switched off in this demo, by design',
    },
  ]
}

/** Read-only Uniswap v4 explorer for USDC and cirBTC on Arc Testnet. Quotes only: no approvals, no swaps. */
export function UniswapExplorer({ form }: { form: SwapForm }) {
  const quote = useUniswapQuote(form)
  const checklist = useChecklist()

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Notice>
          Arc Testnet quote demonstration, read-only research. Uniswap does not list Arc Testnet as a supported network, so
          these are test pools and their prices are not market prices. Nothing here is approved or sent.
        </Notice>
        <UniswapQuoteCard form={form} quote={quote} />
        <PlainEnglishReview form={form} quote={quote} />
        <ExecutionDisabled />
      </div>
      <div className="space-y-6">
        <QuoteDetails form={form} quote={quote} />
        <PoolsCard form={form} quote={quote} />
        <Card>
          <CardTitle>The pair</CardTitle>
          <p className="mt-1 text-sm text-muted">Token details are read live from Arc Testnet, not typed in.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TokenFactCard token={USDC} />
            <TokenFactCard token={CIRBTC} />
          </div>
        </Card>
        <SetupChecklist title="Live data status" items={checklist} />
      </div>
    </div>
  )
}
