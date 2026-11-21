import { useAccount, useBlockNumber, useSwitchChain } from 'wagmi'
import { ARC_CHAIN, ARC_CHAIN_ID } from '@/lib/arc'
import { cn } from '@/lib/cn'

/** Live Arc Testnet status from the RPC, plus a wallet-network mismatch prompt. */
export function NetworkStatus() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const { data: block, isError, isLoading } = useBlockNumber({
    chainId: ARC_CHAIN_ID,
    query: { refetchInterval: 5000 },
  })

  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID

  if (wrongNetwork) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3.5 text-sm font-medium text-warning transition hover:bg-warning/20 disabled:opacity-60"
      >
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        {isPending ? 'Switching…' : 'Switch to Arc Testnet'}
      </button>
    )
  }

  const status = isError ? 'down' : isLoading ? 'loading' : 'live'

  return (
    <div
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm"
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'size-2 rounded-full',
          status === 'live' && 'bg-success',
          status === 'down' && 'bg-danger',
          status === 'loading' && 'animate-pulse bg-subtle',
        )}
        aria-hidden
      />
      <span className="font-medium text-ink">{ARC_CHAIN.name}</span>
      <span className="mono hidden tabular-nums text-subtle sm:inline">
        {status === 'live' && block !== undefined ? `#${block.toLocaleString('en-US')}` : null}
        {status === 'down' ? 'RPC unreachable' : null}
        {status === 'loading' ? 'connecting…' : null}
      </span>
    </div>
  )
}
