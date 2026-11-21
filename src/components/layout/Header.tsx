import { Blocks } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { NetworkStatus } from './NetworkStatus'
import { WalletButton } from './WalletButton'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent" aria-hidden>
            <Blocks className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="display truncate text-lg font-semibold leading-tight text-ink">Arc Builder Playground</p>
            <p className="hidden text-xs text-subtle sm:block">From a prompt to a working onchain app</p>
          </div>
          <Badge tone="warning" className="hidden md:inline-flex">
            Prototype
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <NetworkStatus />
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
