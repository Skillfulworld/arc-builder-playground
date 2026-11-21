import { useMemo, useState } from 'react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { otherToken, TOKENS, type TokenSymbol } from '@/lib/tokens'
import { useTokenBalance } from './useToken'

export const SLIPPAGE_OPTIONS = ['0.1', '0.5', '1.0'] as const
export type Slippage = (typeof SLIPPAGE_OPTIONS)[number]

export type AmountState = 'empty' | 'invalid' | 'insufficient' | 'ok'

/** All inputs of the swap preview: pair direction, amount, slippage, and the pay-token balance. */
export function useSwapForm() {
  const { address, isConnected } = useAccount()
  const [fromSymbol, setFromSymbol] = useState<TokenSymbol>('USDC')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState<Slippage>('0.5')

  const from = TOKENS[fromSymbol]
  const to = TOKENS[otherToken(fromSymbol)]
  const balance = useTokenBalance(from.address, address)

  const parsed = useMemo(() => {
    if (!amount) return undefined
    try {
      return parseUnits(amount, from.decimals)
    } catch {
      return undefined
    }
  }, [amount, from.decimals])

  let amountState: AmountState = 'ok'
  if (!amount) amountState = 'empty'
  else if (parsed === undefined || parsed === 0n) amountState = 'invalid'
  else if (isConnected && balance.data !== undefined && parsed > balance.data) amountState = 'insufficient'

  const setFrom = (symbol: TokenSymbol) => {
    if (symbol === fromSymbol) return
    setFromSymbol(symbol)
    setAmount('')
  }

  const onAmountChange = (value: string) => {
    const clean = value.replace(',', '.')
    if (!/^\d*\.?\d*$/.test(clean)) return
    const [, fraction = ''] = clean.split('.')
    if (fraction.length > from.decimals) return
    setAmount(clean)
  }

  return {
    from,
    to,
    amount,
    parsed,
    amountState,
    balance,
    slippage,
    setSlippage,
    onAmountChange,
    selectFrom: setFrom,
    selectTo: (symbol: TokenSymbol) => setFrom(otherToken(symbol)),
    flip: () => setFrom(otherToken(fromSymbol)),
  }
}

export type SwapForm = ReturnType<typeof useSwapForm>
