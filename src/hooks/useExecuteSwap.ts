import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { SWAP_ENABLED } from '@/lib/env'
import { createAdapter, describeSwapError, KIT_CHAIN, kit } from '@/lib/swapKit'
import type { QuoteState } from './useQuote'
import type { SwapForm } from './useSwapForm'

/**
 * Runs the swap that was just reviewed. It only ever runs from a click on the
 * Swap button, with the exact tokens and amount of the displayed estimate.
 */
export function useExecuteSwap(form: SwapForm, quote: QuoteState) {
  const { connector, address } = useAccount()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const estimate = quote.estimate
      if (!SWAP_ENABLED) throw new Error('Swaps are switched off')
      if (quote.status !== 'ready' || !estimate) throw new Error('Review a current quote first')
      if (address?.toLowerCase() !== estimate.fromAddress.toLowerCase()) {
        throw new Error('Wallet account changed since the quote. Review the quote again.')
      }
      const adapter = await createAdapter(connector)
      return kit.swap({
        from: { adapter, chain: KIT_CHAIN },
        tokenIn: estimate.tokenIn,
        tokenOut: estimate.tokenOut,
        amountIn: estimate.amountIn,
        config: { slippageBps: form.slippageBps },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries()
    },
  })

  return {
    status: mutation.status,
    result: mutation.data,
    errorMessage: mutation.isError ? describeSwapError(mutation.error) : null,
    execute: () => mutation.mutate(),
    reset: mutation.reset,
  }
}

export type ExecuteSwapState = ReturnType<typeof useExecuteSwap>
