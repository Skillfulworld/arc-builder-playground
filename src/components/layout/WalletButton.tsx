import { ConnectKitButton } from 'connectkit'
import { Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

/** ConnectKit-backed wallet control: connect when idle, address chip when connected. */
export function WalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, truncatedAddress, ensName }) => (
        <button
          type="button"
          onClick={show}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98]',
            isConnected
              ? 'border border-line bg-surface-strong text-ink hover:border-line-strong'
              : 'bg-accent text-on-accent hover:bg-accent-hover',
          )}
        >
          <Wallet className="size-4" aria-hidden />
          <span className={cn(isConnected && 'mono tabular-nums')}>
            {isConnecting ? 'Connecting…' : isConnected ? (ensName ?? truncatedAddress) : 'Connect wallet'}
          </span>
        </button>
      )}
    </ConnectKitButton.Custom>
  )
}
