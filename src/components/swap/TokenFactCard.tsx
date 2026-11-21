import { Badge } from '@/components/ui/Badge'
import { AddressLink } from '@/components/ui/AddressLink'
import { useTokenInfo } from '@/hooks/useToken'
import { formatTokenAmount } from '@/lib/format'
import type { TokenFact } from '@/lib/tokens'
import { TokenIcon } from './TokenIcon'

/** One token in the pair, with metadata re-read from the chain and compared to the documented facts. */
export function TokenFactCard({ token }: { token: TokenFact }) {
  const info = useTokenInfo(token.address)
  const verified = info.decimals !== undefined && info.symbol !== undefined && info.decimals === token.decimals

  return (
    <div className="rounded-2xl border border-line bg-canvas/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TokenIcon symbol={token.symbol} size={36} />
          <div className="min-w-0">
            <p className="display truncate text-base font-semibold text-ink">{info.name ?? token.name}</p>
            <p className="text-sm text-subtle">{info.symbol ?? token.symbol}</p>
          </div>
        </div>
        {info.isLoading ? (
          <Badge>Reading chain…</Badge>
        ) : info.isError ? (
          <Badge tone="danger">Read failed</Badge>
        ) : verified ? (
          <Badge tone="success">Verified onchain</Badge>
        ) : (
          <Badge tone="warning">Mismatch</Badge>
        )}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-subtle">Contract</dt>
          <dd>
            <AddressLink address={token.address} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-subtle">Decimals</dt>
          <dd className="tabular-nums text-ink-2">{info.decimals ?? '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-subtle">Total supply</dt>
          <dd className="tabular-nums text-ink-2">
            {info.totalSupply !== undefined && info.decimals !== undefined
              ? formatTokenAmount(info.totalSupply, info.decimals, 2)
              : '—'}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-pretty text-xs text-subtle">{token.note}</p>
    </div>
  )
}
