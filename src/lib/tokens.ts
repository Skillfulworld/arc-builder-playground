/**
 * Token facts for Arc Testnet.
 * Source: https://docs.arc.io/arc/references/contract-addresses.md (Testnet tabs).
 * The UI re-reads symbol and decimals from the chain and flags any mismatch.
 */
import type { Address } from 'viem'

export interface TokenFact {
  symbol: string
  name: string
  address: Address
  /** Decimals documented by Arc. USDC is shown in its 6-decimal ERC-20 view only. */
  decimals: number
  note: string
}

export const USDC: TokenFact = {
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0x3600000000000000000000000000000000000000',
  decimals: 6,
  note: 'Native gas token on Arc. This is its 6-decimal ERC-20 view.',
}

export const CIRBTC: TokenFact = {
  symbol: 'cirBTC',
  name: 'Circle wrapped Bitcoin',
  address: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
  decimals: 8,
  note: 'Circle wrapped Bitcoin on Arc. Uses 8 decimals like Bitcoin.',
}
