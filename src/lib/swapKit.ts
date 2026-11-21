/**
 * Circle App Kit swap integration for Arc Testnet.
 * The kit finds a route through its swap service, so no router address is typed here.
 * Browser swaps run keyless: no API key is ever placed in frontend code.
 */
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import {
  AppKit,
  getErrorCode,
  isKitError,
  isRetryableError,
  isUserCancellationError,
} from '@circle-fin/app-kit'
import type { EIP1193Provider } from 'viem'
import type { Connector } from 'wagmi'
import type { TokenSymbol } from './tokens'

export const kit = new AppKit()

/** App Kit's identifier for Arc Testnet. */
export const KIT_CHAIN = 'Arc_Testnet' as const

/** App Kit token aliases for the two tokens the Swap Explorer offers. */
export const SDK_TOKEN = { USDC: 'USDC', cirBTC: 'CIRBTC' } as const satisfies Record<TokenSymbol, string>

export type KitAdapter = Awaited<ReturnType<typeof createViemAdapterFromProvider>>

/** Build an adapter from the connected wallet. The wallet must already be on Arc Testnet. */
export async function createAdapter(connector: Connector | undefined): Promise<KitAdapter> {
  if (!connector) throw new Error('Wallet not connected')
  const provider = (await connector.getProvider()) as EIP1193Provider
  return createViemAdapterFromProvider({ provider })
}

/**
 * Plain-language message for a swap failure, or null when the user simply
 * cancelled in their wallet (which is not an error worth showing).
 */
export function describeSwapError(error: unknown): string | null {
  if (isUserCancellationError(error)) return null
  if (isKitError(error)) {
    const code = getErrorCode(error)
    if (code === 1003) return 'No route at this size. Arc Testnet liquidity is thin, so try a smaller amount.'
    if (code === 1009 || code === 5001 || code === 5002) {
      return 'The price moved or the swap reverted. Raise the slippage tolerance (testnet liquidity is thin) and try again.'
    }
    if (code === 1013) return 'This amount is outside what the swap service supports. Try a different amount.'
    if (error.type === 'LIQUIDITY') return 'Not enough liquidity right now. Try a smaller amount or wait a moment.'
    if (error.type === 'BALANCE') {
      return 'Not enough balance or USDC for gas. USDC pays fees on Arc, so keep a little aside.'
    }
    if (isRetryableError(error)) return 'The swap service or network is busy. Try again in a moment.'
    if (error.type === 'INPUT') return 'The swap service rejected these inputs. Check the amount and try again.'
  }
  return 'Something went wrong. Please try again.'
}
