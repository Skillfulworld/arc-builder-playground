import { ConnectKitButton } from 'connectkit'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useNetwork } from '@/hooks/useNetwork'
import type { SwapForm } from '@/hooks/useSwapForm'
import { WRITES_ENABLED } from '@/lib/env'

interface Check {
  label: string
  done: boolean
  hint: string
}

/** Confirmation area: a plain checklist of what must be true, then the single confirm action. */
export function ConfirmPanel({ form }: { form: SwapForm }) {
  const network = useNetwork()

  const checks: Check[] = [
    { label: 'Wallet connected', done: network.isConnected, hint: 'Connect a browser wallet.' },
    { label: 'Wallet on Arc Testnet', done: network.isReady, hint: 'Switch your wallet to Arc Testnet.' },
    { label: 'Valid amount within your balance', done: form.amountState === 'ok', hint: 'Enter an amount you can cover.' },
    { label: 'Live quote available', done: false, hint: 'No quote source is connected yet.' },
    { label: 'Transactions enabled', done: WRITES_ENABLED, hint: 'Turned off while this is a read-only prototype.' },
  ]
  const blocker = checks.find((check) => !check.done)

  return (
    <Card strong className="space-y-4 border-accent/30" aria-labelledby="confirm-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="confirm-heading" className="display text-xl font-semibold text-ink">
          3. Confirm
        </h2>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
          {checks.filter((c) => c.done).length} of {checks.length} ready
        </span>
      </div>

      <ul className="space-y-2.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-3 text-sm">
            {check.done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Done" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-subtle" aria-label="Not done" />
            )}
            <span className="min-w-0">
              <span className={check.done ? 'text-ink' : 'text-muted'}>{check.label}</span>
              {!check.done && <span className="block text-xs text-subtle">{check.hint}</span>}
            </span>
          </li>
        ))}
      </ul>

      {!network.isConnected ? (
        <ConnectKitButton.Custom>
          {({ show }) => (
            <Button onClick={show} className="w-full">
              Connect wallet
            </Button>
          )}
        </ConnectKitButton.Custom>
      ) : network.wrongNetwork ? (
        <Button onClick={network.switchToArc} loading={network.switching} className="w-full">
          Switch to Arc Testnet
        </Button>
      ) : (
        <Button disabled className="w-full">
          Confirm swap
        </Button>
      )}

      <p className="text-pretty text-center text-xs text-subtle" aria-live="polite">
        {network.isReady && blocker
          ? `Not ready: ${blocker.label.toLowerCase()}. ${blocker.hint}`
          : 'Nothing is sent from this screen.'}
      </p>
    </Card>
  )
}
