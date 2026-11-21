/**
 * Optional, public contract addresses supplied through Vite env vars, and the
 * switches that decide which flows may send transactions.
 * Unset or malformed addresses resolve to `undefined`, and the UI shows a
 * "not configured" state instead of guessing an address.
 */
import { isAddress, type Address } from 'viem'

const parseAddress = (value: unknown): Address | undefined =>
  typeof value === 'string' && isAddress(value) ? value : undefined

/** Swaps send Arc Testnet transactions (token allowance and the swap) after the user clicks Swap. */
export const SWAP_ENABLED = true

/** Guestbook publishing stays off until its contract is deployed and reviewed. */
export const GUESTBOOK_WRITES_ENABLED = false

/** Deployed Onchain Guestbook contract on Arc Testnet. */
export const GUESTBOOK_ADDRESS = parseAddress(import.meta.env.VITE_GUESTBOOK_ADDRESS)
