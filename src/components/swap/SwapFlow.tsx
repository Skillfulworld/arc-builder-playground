import { Card, CardTitle } from '@/components/ui/Card'

const STEPS = [
  { title: 'Pick the pair', body: 'Choose the token you pay with and the token you want, then enter a small amount.' },
  { title: 'Get a live quote', body: 'Circle\'s swap service finds a route and estimates your output. This is a read-only request: nothing is signed or sent.' },
  { title: 'Review', body: 'Check the effective rate, the minimum you will receive at your slippage tolerance, and the fees.' },
  { title: 'Approve and swap', body: 'Your wallet may first ask you to allow spending of the token you pay with, then to confirm the swap. You approve each prompt.' },
  { title: 'Confirm', body: 'Arc finalizes in under a second. You receive the token and can open the receipt in the explorer.' },
]

/** Educational walkthrough of what a swap does under the hood. */
export function SwapFlow() {
  return (
    <Card>
      <CardTitle>How a swap works</CardTitle>
      <p className="mt-1 text-sm text-muted">The five steps this explorer walks you through.</p>
      <ol className="mt-5 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <span className="display grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-strong text-xs font-semibold tabular-nums text-accent">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-0.5 text-pretty text-sm text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
