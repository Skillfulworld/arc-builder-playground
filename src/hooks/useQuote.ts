import { UNISWAP_QUOTER_ADDRESS } from '@/lib/env'
import type { SwapForm } from './useSwapForm'

export type QuoteStatus =
  /** No valid amount yet. */
  | 'idle'
  /** The quoter address is missing from the environment. */
  | 'unconfigured'
  /** A quoter is configured but quote requests are not implemented yet. */
  | 'unavailable'

/**
 * Quote state for the current form. There is no live quote source yet, so this
 * only reports why a quote is missing; it never produces a number.
 */
export function useQuote(form: SwapForm): { status: QuoteStatus; reason: string } {
  if (form.amountState !== 'ok') {
    return { status: 'idle', reason: 'Enter an amount to request a quote.' }
  }
  if (!UNISWAP_QUOTER_ADDRESS) {
    return {
      status: 'unconfigured',
      reason: 'No quote source. Set VITE_UNISWAP_QUOTER_ADDRESS to the Uniswap quoter on Arc Testnet.',
    }
  }
  return { status: 'unavailable', reason: 'A quoter is configured, but live quote requests are not built yet.' }
}
