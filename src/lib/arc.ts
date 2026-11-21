/**
 * Arc Testnet facts used across the app.
 * Chain ID, RPC URLs and explorer come from viem's built-in `arcTestnet` definition;
 * nothing here is hand-typed. Reference: https://docs.arc.io/arc/references/connect-to-arc.md
 */
import { arcTestnet } from 'viem/chains'
import type { Address } from 'viem'

export const ARC_CHAIN = arcTestnet
export const ARC_CHAIN_ID = arcTestnet.id
export const ARC_EXPLORER_URL = arcTestnet.blockExplorers.default.url

export const explorerAddressUrl = (address: Address) => `${ARC_EXPLORER_URL}/address/${address}`
export const explorerTxUrl = (hash: string) => `${ARC_EXPLORER_URL}/tx/${hash}`
