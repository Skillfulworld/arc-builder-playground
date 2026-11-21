import { useEffect, useRef, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { ChevronDown, ExternalLink, LogOut, Wallet } from 'lucide-react'
import type { Address } from 'viem'
import { useDisconnect } from 'wagmi'
import { AddressLink } from '@/components/ui/AddressLink'
import { useNetwork } from '@/hooks/useNetwork'
import { useTokenBalance } from '@/hooks/useToken'
import { explorerAddressUrl } from '@/lib/arc'
import { cn } from '@/lib/cn'
import { formatTokenAmount, shortAddress } from '@/lib/format'
import { USDC } from '@/lib/tokens'

function ConnectedMenu({ address }: { address: Address }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { disconnect } = useDisconnect()
  const network = useNetwork()
  const balance = useTokenBalance(USDC.address, address)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-strong px-4 text-sm font-semibold text-ink transition hover:border-line-strong active:scale-[0.98]"
      >
        <Wallet className="size-4" aria-hidden />
        <span className="mono tabular-nums">{shortAddress(address)}</span>
        <ChevronDown className={cn('size-4 text-subtle transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Wallet"
          className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-4 rounded-2xl border border-line bg-surface-muted p-4 shadow-card"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Connected wallet</p>
            <div className="mt-1.5">
              <AddressLink address={address} />
            </div>
          </div>

          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-subtle">Wallet network</dt>
              <dd className={cn('text-right', network.wrongNetwork ? 'text-warning' : 'text-ink-2')}>
                {network.walletChainName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-subtle">USDC balance</dt>
              <dd className="tabular-nums text-ink-2">
                {network.wrongNetwork
                  ? 'Switch network'
                  : balance.isLoading
                    ? 'Loading…'
                    : balance.isError
                      ? 'Unavailable'
                      : balance.data !== undefined
                        ? formatTokenAmount(balance.data, USDC.decimals, 2)
                        : '—'}
              </dd>
            </div>
          </dl>

          {network.wrongNetwork && (
            <button
              type="button"
              onClick={network.switchToArc}
              disabled={network.switching}
              className="min-h-11 w-full rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
            >
              {network.switching ? 'Switching…' : 'Switch to Arc Testnet'}
            </button>
          )}

          <div className="flex gap-2">
            <a
              href={explorerAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink-2 transition hover:border-line-strong"
            >
              Explorer <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-danger/30 text-sm font-semibold text-danger transition hover:bg-danger/10"
            >
              <LogOut className="size-3.5" aria-hidden />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Wallet control: connect via ConnectKit when idle, address menu with disconnect when connected. */
export function WalletButton() {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address }) =>
        isConnected && address ? (
          <ConnectedMenu address={address} />
        ) : (
          <button
            type="button"
            onClick={show}
            disabled={isConnecting}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover active:scale-[0.98] disabled:opacity-70"
          >
            <Wallet className="size-4" aria-hidden />
            {isConnecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )
      }
    </ConnectKitButton.Custom>
  )
}
