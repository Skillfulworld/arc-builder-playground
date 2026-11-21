/**
 * Optional, public contract addresses supplied through Vite env vars.
 * Unset or malformed values resolve to `undefined`, and the UI shows a
 * "not configured" state instead of guessing an address.
 */
import { isAddress, type Address } from 'viem'

const parseAddress = (value: unknown): Address | undefined =>
  typeof value === 'string' && isAddress(value) ? value : undefined

/** Deployed Onchain Guestbook contract on Arc Testnet. */
export const GUESTBOOK_ADDRESS = parseAddress(import.meta.env.VITE_GUESTBOOK_ADDRESS)

/** Uniswap quoter on Arc Testnet, used for read-only swap quotes. */
export const UNISWAP_QUOTER_ADDRESS = parseAddress(import.meta.env.VITE_UNISWAP_QUOTER_ADDRESS)
