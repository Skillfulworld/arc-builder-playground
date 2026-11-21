/** Display helpers shared by the Uniswap quote components. */

/** 3000 pips -> "0.30%". */
export const feeLabel = (pips: number) => `${(pips / 10_000).toFixed(2)}%`

/** 0.0123 -> "1.23%", and very small values as "<0.01%". */
export function percent(fraction: number): string {
  const value = fraction * 100
  return value > 0 && value < 0.01 ? '<0.01%' : `${value.toFixed(2)}%`
}

export type ImpactLevel = 'low' | 'warn' | 'high'

export const impactLevel = (impact: number): ImpactLevel => (impact >= 0.05 ? 'high' : impact >= 0.01 ? 'warn' : 'low')

export const IMPACT_TEXT_CLASS: Record<ImpactLevel, string> = {
  low: 'text-success',
  warn: 'text-warning',
  high: 'text-danger',
}
