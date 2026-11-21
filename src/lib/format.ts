import { formatUnits } from 'viem'

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/** Format a raw token amount with grouping and a capped number of fraction digits. */
export function formatTokenAmount(raw: bigint, decimals: number, maxFraction = 4): string {
  const value = Number(formatUnits(raw, decimals))
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  }).format(value)
}

export function timeAgo(unixSeconds: number, now = Date.now()): string {
  const diff = Math.max(0, Math.floor(now / 1000) - unixSeconds)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/** Deterministic hue (0-359) from an address, used for avatar tint only. */
export function addressHue(address: string): number {
  let hash = 0
  for (let i = 2; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) % 360
  return hash
}
