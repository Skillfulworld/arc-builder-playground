import { TokenBTC, TokenUSDC } from '@web3icons/react'

export function TokenIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  if (symbol === 'USDC') return <TokenUSDC variant="branded" size={size} />
  return <TokenBTC variant="branded" size={size} />
}
