import { useBlockNumber } from 'wagmi'
import { useNetwork } from '@/hooks/useNetwork'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { cn } from '@/lib/cn'

/** Selected network, live RPC status, and a prompt when the wallet is on a different network. */
export function NetworkStatus() {
  const network = useNetwork()
  const { data: block, isError, isLoading } = useBlockNumber({
    chainId: ARC_CHAIN_ID,
    query: { refetchInterval: 5000 },
  })

  if (network.wrongNetwork) {
    return (
      <button
        type="button"
        onClick={network.switchToArc}
        disabled={network.switching}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3.5 text-sm font-medium text-warning transition hover:bg-warning/20 disabled:opacity-60"
        title={`Your wallet is on ${network.walletChainName}. This app only supports ${network.appChainName}.`}
      >
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        <span className="hidden sm:inline">Wallet on {network.walletChainName} ·</span>
        {network.switching ? 'Switching…' : 'Switch to Arc Testnet'}
      </button>
    )
  }

  const status = isError ? 'down' : isLoading ? 'loading' : 'live'

  return (
    <div
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm"
      role="status"
      aria-live="polite"
      aria-label={`Network: ${network.appChainName}, ${status === 'live' ? 'live' : status === 'down' ? 'unreachable' : 'connecting'}`}
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
      <span className="font-medium text-ink">{network.appChainName}</span>
      <span className="mono hidden tabular-nums text-subtle sm:inline">
        {status === 'live' && block !== undefined ? `#${block.toLocaleString('en-US')}` : null}
        {status === 'down' ? 'RPC unreachable' : null}
        {status === 'loading' ? 'connecting…' : null}
      </span>
    </div>
  )
}
