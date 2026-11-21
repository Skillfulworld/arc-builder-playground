import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useSwapForm } from '@/hooks/useSwapForm'
import { SWAP_ENABLED } from '@/lib/env'
import { AppKitSwap } from './AppKitSwap'
import { ModeTabs, type SwapMode } from './ModeTabs'
import { TestnetGuide } from '@/components/layout/TestnetGuide'
import { UniswapExplorer } from './UniswapExplorer'

export function SwapExplorer() {
  const form = useSwapForm()
  const [mode, setMode] = useState<SwapMode>('uniswap')

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Section 01"
        title="Swap Explorer"
        description={
          mode === 'uniswap'
            ? 'Explore how a USDC and cirBTC swap would work on Uniswap v4 on Arc Testnet. Ask for live quotes, see pool depth, fees and price impact, and read a plain-English review. Nothing is approved or sent.'
            : 'Swap USDC and cirBTC on Arc Testnet through Circle\'s swap service. Choose the tokens, enter a small amount, review the live quote and fees, then confirm in your wallet. Test funds only.'
        }
        aside={
          mode === 'uniswap' ? (
            <Badge tone="accent">Arc Testnet quote demo</Badge>
          ) : (
            <Badge tone={SWAP_ENABLED ? 'success' : 'accent'}>{SWAP_ENABLED ? 'Testnet swaps live' : 'Read-only preview'}</Badge>
          )
        }
      />

      <ModeTabs mode={mode} onChange={setMode} />

      {mode === 'uniswap' ? <UniswapExplorer form={form} /> : <AppKitSwap form={form} />}

      <TestnetGuide />
    </div>
  )
}
