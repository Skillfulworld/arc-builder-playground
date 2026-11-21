/**
 * Optional, public contract addresses supplied through Vite env vars, and the
 * switches that decide which flows may send transactions.
 * Unset or malformed addresses resolve to `undefined`, and the UI shows a
 * "not configured" state instead of guessing an address.
 */
import { isAddress, type Address } from 'viem'
import { GUESTBOOK_DEPLOYMENT } from './deployments'

const parseAddress = (value: unknown): Address | undefined =>
  typeof value === 'string' && isAddress(value) ? value : undefined

/** Swaps send Arc Testnet transactions (token allowance and the swap) after the user clicks Swap. */
export const SWAP_ENABLED = true

/** Guestbook publishing: on, because the reviewed contract is deployed on Arc Testnet. */
export const GUESTBOOK_WRITES_ENABLED = true

/**
 * Onchain Guestbook contract on Arc Testnet. Defaults to the deployment recorded in
 * `deployments.ts`; `VITE_GUESTBOOK_ADDRESS` can override it (for example to test a redeploy).
 */
export const GUESTBOOK_ADDRESS: Address = parseAddress(import.meta.env.VITE_GUESTBOOK_ADDRESS) ?? GUESTBOOK_DEPLOYMENT.address
