import { Check, ChevronDown } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useDismiss } from '@/hooks/useDismiss'
import { useTokenBalance } from '@/hooks/useToken'
import { cn } from '@/lib/cn'
import { formatTokenAmount } from '@/lib/format'
import { TOKENS, type TokenSymbol } from '@/lib/tokens'
import { TokenIcon } from './TokenIcon'

const SYMBOLS = Object.keys(TOKENS) as TokenSymbol[]

function OptionBalance({ symbol }: { symbol: TokenSymbol }) {
  const { address } = useAccount()
  const token = TOKENS[symbol]
  const { data, isLoading } = useTokenBalance(token.address, address)
  if (!address) return <span className="text-xs text-subtle">Connect to see</span>
  if (isLoading) return <span className="text-xs text-subtle">Loading…</span>
  return <span className="text-xs tabular-nums text-subtle">{data !== undefined ? formatTokenAmount(data, token.decimals, 4) : '—'}</span>
}

interface TokenSelectProps {
  label: string
  value: TokenSymbol
  onChange: (symbol: TokenSymbol) => void
}

/** Pick USDC or cirBTC. Choosing the token already on the other side flips the pair. */
export function TokenSelect({ label, value, onChange }: TokenSelectProps) {
  const { open, setOpen, ref } = useDismiss<HTMLDivElement>()

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${value}. Change token`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-strong py-1.5 pl-2 pr-3 text-sm font-semibold text-ink transition hover:border-line-strong"
      >
        <TokenIcon symbol={value} size={24} />
        {value}
        <ChevronDown className={cn('size-4 text-subtle transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-20 mt-2 w-64 space-y-1 rounded-2xl border border-line bg-surface-muted p-2 shadow-card"
        >
          {SYMBOLS.map((symbol) => {
            const selected = symbol === value
            return (
              <li key={symbol} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(symbol)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition',
                    selected ? 'bg-surface-strong' : 'hover:bg-surface',
                  )}
                >
                  <TokenIcon symbol={symbol} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{symbol}</span>
                    <OptionBalance symbol={symbol} />
                  </span>
                  {selected && <Check className="size-4 text-accent" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
