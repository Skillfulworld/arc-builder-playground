import { cn } from '@/lib/cn'

export type SwapMode = 'uniswap' | 'app-kit'

const MODES: { id: SwapMode; label: string; hint: string }[] = [
  { id: 'uniswap', label: 'Uniswap quotes', hint: 'Arc Testnet quote demo, read-only' },
  { id: 'app-kit', label: 'Testnet swap', hint: 'Circle App Kit, sends testnet txs' },
]

/** Switches between the read-only Uniswap explorer and the Circle App Kit testnet swap. */
export function ModeTabs({ mode, onChange }: { mode: SwapMode; onChange: (mode: SwapMode) => void }) {
  return (
    <div role="tablist" aria-label="Swap mode" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
      {MODES.map(({ id, label, hint }) => {
        const active = id === mode
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'min-h-12 rounded-xl px-3 py-2 text-left transition',
              active ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink',
            )}
          >
            <span className="block text-sm font-semibold">{label}</span>
            <span className={cn('block truncate text-xs', active ? 'text-on-accent/70' : 'text-subtle')}>{hint}</span>
          </button>
        )
      })}
    </div>
  )
}
