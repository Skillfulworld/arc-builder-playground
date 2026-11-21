import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import { UNISWAP_QUOTER_ADDRESS } from '@/lib/env'
import { CIRBTC, USDC } from '@/lib/tokens'
import { useTokenInfo } from '@/hooks/useToken'
import { SwapCard } from './SwapCard'
import { SwapFlow } from './SwapFlow'
import { TokenFactCard } from './TokenFactCard'

function useChecklist() {
  const usdc = useTokenInfo(USDC.address)
  const cirbtc = useTokenInfo(CIRBTC.address)
  return [
    {
      label: 'USDC token',
      ready: usdc.decimals === USDC.decimals,
      detail: usdc.decimals === USDC.decimals ? 'Read from chain: 6 decimals' : 'Waiting for an onchain read',
    },
    {
      label: 'cirBTC token',
      ready: cirbtc.decimals === CIRBTC.decimals,
      detail: cirbtc.decimals === CIRBTC.decimals ? 'Read from chain: 8 decimals' : 'Waiting for an onchain read',
    },
    {
      label: 'Uniswap quoter',
      ready: Boolean(UNISWAP_QUOTER_ADDRESS),
      detail: UNISWAP_QUOTER_ADDRESS ? 'VITE_UNISWAP_QUOTER_ADDRESS is set' : 'Set VITE_UNISWAP_QUOTER_ADDRESS',
    },
  ]
}

export function SwapExplorer() {
  const checklist = useChecklist()

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Section 01"
        title="Swap Explorer"
        description="Explore a USDC to cirBTC swap on Arc Testnet. See both tokens verified straight from the chain, preview the swap inputs, and learn each step before any transaction exists."
        aside={<Badge tone="accent">Read-only preview</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div>
          <SwapCard />
        </div>
        <div className="space-y-6">
          <Card>
            <CardTitle>The pair</CardTitle>
            <p className="mt-1 text-sm text-muted">Token details are read live from Arc Testnet, not typed in.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TokenFactCard token={USDC} />
              <TokenFactCard token={CIRBTC} />
            </div>
          </Card>
          <SetupChecklist title="Live data status" items={checklist} />
          <SwapFlow />
        </div>
      </div>
    </div>
  )
}
