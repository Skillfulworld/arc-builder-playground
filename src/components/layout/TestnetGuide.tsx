import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'

type Tone = 'success' | 'accent' | 'neutral'

const ROWS: { feature: string; tag: string; tone: Tone; body: string }[] = [
  {
    feature: 'Onchain Guestbook',
    tag: 'Live on Arc Testnet',
    tone: 'success',
    body: 'Publishing sends a real testnet transaction to the deployed Guestbook contract after you approve it in your wallet. It costs test USDC for gas only. Messages are read straight from the contract.',
  },
  {
    feature: 'Swap Explorer: Testnet swap',
    tag: 'Live on Arc Testnet',
    tone: 'success',
    body: "Sends testnet transactions after you click Swap. It is routed by Circle's swap service, not by Uniswap, and uses test funds.",
  },
  {
    feature: 'Swap Explorer: Uniswap quotes',
    tag: 'Read-only research',
    tone: 'accent',
    body: 'A quote demonstration using Uniswap v4 contracts found on Arc Testnet. Uniswap does not list this network as supported, so these are test pools and their prices are not market prices. Approvals and swaps are disabled.',
  },
  {
    feature: 'Arc mainnet',
    tag: 'Not used',
    tone: 'neutral',
    body: 'Nothing in this app connects to Arc mainnet or sends real funds.',
  },
]

/** Plain explanation of which parts send testnet transactions and which are read-only research. */
export function TestnetGuide() {
  return (
    <Card aria-labelledby="testnet-guide-heading">
      <CardTitle id="testnet-guide-heading">What runs where</CardTitle>
      <p className="mt-1 text-sm text-muted">This is an educational prototype on Arc Testnet. Here is what each part does.</p>
      <ul className="mt-4 divide-y divide-line">
        {ROWS.map((row) => (
          <li key={row.feature} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
            <div className="shrink-0 sm:w-56">
              <p className="text-sm font-semibold text-ink">{row.feature}</p>
              <Badge tone={row.tone} className="mt-1.5">
                {row.tag}
              </Badge>
            </div>
            <p className="text-pretty text-sm text-muted">{row.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
