import type { SwapEstimate } from '@circle-fin/app-kit'
import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { createAdapter, describeSwapError, KIT_CHAIN, kit, SDK_TOKEN } from '@/lib/swapKit'
import { useDebounced } from './useDebounced'
import { useNetwork } from './useNetwork'
import type { SwapForm } from './useSwapForm'

export type QuoteStatus = 'idle' | 'need-wallet' | 'wrong-network' | 'loading' | 'ready' | 'error'

export interface QuoteState {
  status: QuoteStatus
  /** One line explaining the current state. */
  reason: string
  estimate?: SwapEstimate
  /** True while an already-shown quote is being refreshed in the background. */
  refreshing: boolean
  refetch: () => void
}

/**
 * Live estimate from Circle's swap service for the current form. A quote needs a
 * connected wallet on Arc Testnet (the kit reads the account from it). Nothing is sent.
 */
export function useQuote(form: SwapForm): QuoteState {
  const { connector, address } = useAccount()
  const network = useNetwork()
  const debouncedAmount = useDebounced(form.amount, 600)
  const settled = debouncedAmount === form.amount

  const canQuote = network.isReady && form.amountState === 'ok' && form.parsed !== undefined && settled
  const amountIn = form.parsed !== undefined ? formatUnits(form.parsed, form.from.decimals) : ''

  const query = useQuery({
    queryKey: ['swap-estimate', address, form.from.symbol, form.to.symbol, amountIn, form.slippageBps],
    enabled: canQuote,
    retry: false,
    staleTime: 20_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const adapter = await createAdapter(connector)
      return kit.estimateSwap({
        from: { adapter, chain: KIT_CHAIN },
        tokenIn: SDK_TOKEN[form.from.symbol],
        tokenOut: SDK_TOKEN[form.to.symbol],
        amountIn,
        config: { slippageBps: form.slippageBps },
      })
    },
  })

  const refetch = () => {
    void query.refetch()
  }
  const base = { refreshing: query.isFetching && query.data !== undefined, refetch }

  if (form.amountState !== 'ok') return { ...base, status: 'idle', reason: 'Enter an amount to get a live quote.' }
  if (!network.isConnected) return { ...base, status: 'need-wallet', reason: 'Connect your wallet to get a live quote.' }
  if (network.wrongNetwork) {
    return { ...base, status: 'wrong-network', reason: 'Switch your wallet to Arc Testnet to get a live quote.' }
  }
  if (query.isError && settled) {
    return {
      ...base,
      status: 'error',
      reason: describeSwapError(query.error) ?? 'Could not get a quote. Try again.',
    }
  }
  if (query.data && settled) {
    return { ...base, status: 'ready', reason: 'Estimate from the swap service. The final amount can differ slightly.', estimate: query.data }
  }
  return { ...base, status: 'loading', reason: 'Fetching a live quote…' }
}
