import { ConnectKitButton } from 'connectkit'
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import type { ExecuteSwapState } from '@/hooks/useExecuteSwap'
import { useNetwork } from '@/hooks/useNetwork'
import type { QuoteState } from '@/hooks/useQuote'
import type { SwapForm } from '@/hooks/useSwapForm'
import { explorerTxUrl } from '@/lib/arc'
import { SWAP_ENABLED } from '@/lib/env'

interface Check {
  label: string
  done: boolean
  hint: string
}

interface ConfirmPanelProps {
  form: SwapForm
  quote: QuoteState
  swap: ExecuteSwapState
}

/** Confirmation area: what must be true, the single confirm action, and the outcome. */
export function ConfirmPanel({ form, quote, swap }: ConfirmPanelProps) {
  const network = useNetwork()
  const pending = swap.status === 'pending'

  if (swap.status === 'success' && swap.result) {
    const { result } = swap
    const link = result.explorerUrl ?? explorerTxUrl(result.txHash)
    return (
      <Card strong className="space-y-4 border-success/30" aria-labelledby="confirm-heading">
        <h2 id="confirm-heading" className="display text-xl font-semibold text-ink">
          3. Swap submitted
        </h2>
        <Notice>
          {result.amountOut
            ? `Swapped ${result.amountIn} ${form.from.symbol} for about ${result.amountOut} ${form.to.symbol}.`
            : `Swapped ${result.amountIn} ${form.from.symbol} for ${form.to.symbol}.`}{' '}
          Status: {result.progress.status.toLowerCase()}.
        </Notice>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          View transaction <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            swap.reset()
            form.onAmountChange('')
          }}
        >
          Start another swap
        </Button>
      </Card>
    )
  }

  const checks: Check[] = [
    { label: 'Wallet connected', done: network.isConnected, hint: 'Connect a browser wallet.' },
    { label: 'Wallet on Arc Testnet', done: network.isReady, hint: 'Switch your wallet to Arc Testnet.' },
    { label: 'Valid amount within your balance', done: form.amountState === 'ok', hint: 'Enter an amount you can cover.' },
    { label: 'Live quote available', done: quote.status === 'ready', hint: quote.reason },
    { label: 'Swaps enabled', done: SWAP_ENABLED, hint: 'Swaps are switched off in this build.' },
  ]
  const blocker = checks.find((check) => !check.done)
  const provider = quote.estimate?.route?.provider

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
        <Button onClick={swap.execute} disabled={Boolean(blocker)} loading={pending} className="w-full">
          {pending ? 'Confirm in your wallet…' : `Swap ${form.amount || '0'} ${form.from.symbol} for ${form.to.symbol}`}
        </Button>
      )}

      {swap.status === 'error' && swap.errorMessage && <Notice tone="danger">{swap.errorMessage}</Notice>}

      <p className="text-pretty text-center text-xs text-subtle" aria-live="polite">
        {pending
          ? 'Your wallet may ask you to approve spending first, then to confirm the swap. Approve each prompt.'
          : provider
            ? `Routed by ${provider} through Circle's swap service. The route can change, and the provider's terms apply. Test funds only.`
            : 'Swaps run on Arc Testnet with test funds. Your wallet asks you to approve each step.'}
      </p>
    </Card>
  )
}
