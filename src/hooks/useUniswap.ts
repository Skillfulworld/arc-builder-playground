import { useQuery } from '@tanstack/react-query'
import { formatUnits, type Address } from 'viem'
import { checkDeployment, quoteBest, readPools, type QuoteResult } from '@/lib/uniswap'
import { useDebounced } from './useDebounced'
import type { SwapForm } from './useSwapForm'

/** Does the Uniswap v4 Quoter exist on Arc Testnet and point at the expected PoolManager? */
export function useUniswapDeployment() {
  return useQuery({ queryKey: ['uniswap-deployment'], queryFn: checkDeployment, staleTime: 5 * 60_000, retry: 1 })
}

/** Standard fee-tier pools for the pair, read from the chain. */
export function useUniswapPools(tokenA: Address, tokenB: Address) {
  return useQuery({
    queryKey: ['uniswap-pools', tokenA, tokenB],
    queryFn: () => readPools(tokenA, tokenB),
    refetchInterval: 30_000,
    retry: 1,
  })
}

export type UniswapQuoteStatus = 'idle' | 'loading' | 'ready' | 'no-route' | 'insufficient-liquidity' | 'error'

export interface UniswapQuoteState {
  status: UniswapQuoteStatus
  result?: QuoteResult
  /** True while a request is in flight, including a manual refresh of a quote already shown. */
  fetching: boolean
  /** Request a fresh quote right now. */
  refresh: () => void
}

/**
 * Live Uniswap v4 quote for the form. It reads the chain through the public RPC, so no
 * wallet is needed. It requests a quote when the amount settles, and again on demand.
 */
export function useUniswapQuote(form: SwapForm): UniswapQuoteState {
  const debounced = useDebounced(form.amount, 500)
  const settled = debounced === form.amount
  const amountIn = form.parsed !== undefined && form.parsed > 0n ? form.parsed : undefined
  const enabled = amountIn !== undefined && settled

  const query = useQuery({
    queryKey: ['uniswap-quote', form.from.address, form.to.address, amountIn?.toString()],
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      if (amountIn === undefined) throw new Error('No amount')
      return quoteBest(form.from.address, form.to.address, amountIn)
    },
  })

  const refresh = () => {
    if (enabled) void query.refetch()
  }
  const base = { fetching: query.isFetching, refresh }

  if (amountIn === undefined) return { ...base, status: 'idle' }
  if (!settled || (query.isPending && query.isFetching)) return { ...base, status: 'loading' }
  if (query.isError) return { ...base, status: 'error' }
  if (!query.data) return { ...base, status: 'loading' }
  return {
    ...base,
    result: query.data,
    status: query.data.kind === 'ok' ? 'ready' : query.data.kind,
  }
}

/** Human-readable amount with a sensible number of digits, without float noise. */
export function formatAmount(raw: bigint, decimals: number): string {
  const value = Number(formatUnits(raw, decimals))
  if (value === 0) return '0'
  const fixed = value.toFixed(value >= 1 ? 4 : 8)
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed
}
