/**
 * Contracts deployed by this project. Public facts only; no keys.
 * The Guestbook was deployed to Arc Testnet (chain 5042002). Its runtime bytecode was
 * compared byte for byte with the compiled artifact after deployment (exact match).
 */
import type { Address, Hex } from 'viem'

export const GUESTBOOK_DEPLOYMENT = {
  address: '0xdb1b657b487c81f68c3613fe4462c121f4ddc3c3' as Address,
  /** Block of the deployment transaction; event queries start here. */
  deployBlock: 73_329_051n,
  txHash: '0xa1fd5b9ca90cee6447296786760015dc5a99f1551867c0d1e4f6382be7f58e58' as Hex,
  deployedAt: '2026-11-21T08:23:45.807Z',
} as const
