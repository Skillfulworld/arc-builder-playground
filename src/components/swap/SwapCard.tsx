import { useMemo, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { parseUnits } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { useTokenBalance } from '@/hooks/useToken'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { UNISWAP_QUOTER_ADDRESS } from '@/lib/env'
import { cn } from '@/lib/cn'
import { formatTokenAmount } from '@/lib/format'
import { CIRBTC, USDC } from '@/lib/tokens'
import { TokenIcon } from './TokenIcon'

const SLIPPAGE_OPTIONS = ['0.1', '0.5', '1.0'] as const

function TokenChip({ symbol }: { symbol: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface-strong py-1.5 pl-2 pr-3.5 text-sm font-semibold text-ink">
      <TokenIcon symbol={symbol} size={22} />
      {symbol}
    </span>
  )
}

/** Read-only swap preview card: amount entry, estimate slot, and honest CTA states. No transactions are sent. */
export function SwapCard() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { data: balance } = useTokenBalance(USDC.address, address)

  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState<(typeof SLIPPAGE_OPTIONS)[number]>('0.5')

  const parsed = useMemo(() => {
    if (!amount) return undefined
    try {
      return parseUnits(amount, USDC.decimals)
    } catch {
      return undefined
    }
  }, [amount])

  const onChange = (value: string) => {
    const clean = value.replace(',', '.')
    if (!/^\d*\.?\d*$/.test(clean)) return
    const [, fraction = ''] = clean.split('.')
    if (fraction.length > USDC.decimals) return
    setAmount(clean)
  }

  const insufficient = parsed !== undefined && balance !== undefined && parsed > balance
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID

  return (
    <Card strong className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="display text-xl font-semibold text-ink">Swap preview</h2>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Arc Testnet</span>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="flex items-center justify-between text-xs text-subtle">
          <label htmlFor="swap-amount" className="font-medium uppercase tracking-[0.08em]">
            You pay
          </label>
          <span className="tabular-nums">
            {isConnected && balance !== undefined
              ? `Balance: ${formatTokenAmount(balance, USDC.decimals, 2)} USDC`
              : 'Balance: connect wallet'}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="swap-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={insufficient}
            className="display min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums text-ink outline-none sm:text-4xl"
          />
          <TokenChip symbol="USDC" />
        </div>
        {insufficient && <p className="mt-2 text-sm text-danger">Amount exceeds your USDC balance.</p>}
      </div>

      <div className="relative z-10 -my-5 flex justify-center" aria-hidden>
        <span className="grid size-9 place-items-center rounded-xl border border-line bg-surface-muted text-muted">
          <ArrowDown className="size-4" />
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/40 p-4">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">You receive (estimate)</div>
        <div className="mt-3 flex items-center gap-3">
          <p className="display min-w-0 flex-1 text-3xl font-semibold tabular-nums text-subtle sm:text-4xl" aria-label="No quote available">
            —
          </p>
          <TokenChip symbol="cirBTC" />
        </div>
      </div>

      <dl className="space-y-2.5 px-1 pt-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">Route</dt>
          <dd className="text-right text-ink-2">Uniswap on Arc (pool not verified)</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">Slippage tolerance</dt>
          <dd>
            <div role="radiogroup" aria-label="Slippage tolerance" className="flex gap-1">
              {SLIPPAGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={slippage === option}
                  onClick={() => setSlippage(option)}
                  className={cn(
                    'min-h-9 rounded-lg border px-2.5 text-xs font-semibold tabular-nums transition',
                    slippage === option
                      ? 'border-accent/50 bg-accent/15 text-accent'
                      : 'border-line text-muted hover:text-ink',
                  )}
                >
                  {option}%
                </button>
              ))}
            </div>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">Minimum received</dt>
          <dd className="tabular-nums text-subtle">—</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-subtle">Network fee</dt>
          <dd className="text-right text-ink-2">Paid in USDC on Arc</dd>
        </div>
      </dl>

      <div className="pt-2">
        {!isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <Button onClick={show} className="w-full">
                Connect wallet
              </Button>
            )}
          </ConnectKitButton.Custom>
        ) : wrongNetwork ? (
          <Button onClick={() => switchChain({ chainId: ARC_CHAIN_ID })} loading={switching} className="w-full">
            Switch to Arc Testnet
          </Button>
        ) : (
          <Button disabled className="w-full">
            Swapping is disabled in this prototype
          </Button>
        )}
      </div>

      <Notice>
        {UNISWAP_QUOTER_ADDRESS
          ? 'A quoter address is configured, but live quoting is not wired up yet.'
          : `No live quote yet: the Uniswap quoter for ${USDC.symbol} to ${CIRBTC.symbol} is not configured. This prototype never invents prices.`}
      </Notice>
    </Card>
  )
}
