import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import { useExecuteSwap } from '@/hooks/useExecuteSwap'
import { useInjectedWallet } from '@/hooks/useInjectedWallet'
import { useQuote, type QuoteState } from '@/hooks/useQuote'
import { useSwapForm } from '@/hooks/useSwapForm'
import { useTokenInfo } from '@/hooks/useToken'
import { SWAP_ENABLED } from '@/lib/env'
import { CIRBTC, USDC } from '@/lib/tokens'
import { ConfirmPanel } from './ConfirmPanel'
import { ReviewPanel } from './ReviewPanel'
import { SwapCard } from './SwapCard'
import { SwapFlow } from './SwapFlow'
import { TokenFactCard } from './TokenFactCard'

function useChecklist(quote: QuoteState) {
  const usdc = useTokenInfo(USDC.address)
  const cirbtc = useTokenInfo(CIRBTC.address)
  const wallet = useInjectedWallet()
  return [
    wallet,
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
      label: 'Swap service (Circle App Kit)',
      ready: quote.status === 'ready',
      detail: quote.status === 'ready' ? `Live quote via ${quote.estimate?.route?.provider ?? 'swap service'}` : quote.reason,
    },
  ]
}

export function SwapExplorer() {
  const form = useSwapForm()
  const quote = useQuote(form)
  const swap = useExecuteSwap(form, quote)
  const checklist = useChecklist(quote)
  const locked = swap.status === 'pending'

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Section 01"
        title="Swap Explorer"
        description="Swap USDC and cirBTC on Arc Testnet. Choose the tokens, enter a small amount, review the live quote and fees, then confirm in your wallet. Test funds only."
        aside={<Badge tone={SWAP_ENABLED ? 'success' : 'accent'}>{SWAP_ENABLED ? 'Testnet swaps live' : 'Read-only preview'}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SwapCard form={form} quote={quote} locked={locked} />
          <ReviewPanel form={form} quote={quote} locked={locked} />
          <ConfirmPanel form={form} quote={quote} swap={swap} />
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
