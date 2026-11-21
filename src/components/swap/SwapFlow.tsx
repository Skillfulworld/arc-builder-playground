import { Card, CardTitle } from '@/components/ui/Card'

const STEPS = [
  { title: 'Pick the pair', body: 'Choose the token you pay with and the token you want. Here: USDC for cirBTC.' },
  { title: 'Ask for a quote', body: 'A read-only call asks the pool what you would receive. Nothing is signed or sent.' },
  { title: 'Allow the router', body: 'Your wallet grants a spending allowance so the router can pull USDC. This is the first transaction.' },
  { title: 'Swap', body: 'The router trades against the pool and reverts if the price moves beyond your slippage tolerance.' },
  { title: 'Confirm', body: 'Arc finalizes in under a second. You receive cirBTC and can open the receipt in the explorer.' },
]

/** Educational walkthrough of what a swap does under the hood. */
export function SwapFlow() {
  return (
    <Card>
      <CardTitle>How a swap works</CardTitle>
      <p className="mt-1 text-sm text-muted">The five steps this explorer will walk through once quoting is live.</p>
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
