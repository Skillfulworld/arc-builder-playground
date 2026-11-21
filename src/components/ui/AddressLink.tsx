import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import type { Address } from 'viem'
import { explorerAddressUrl } from '@/lib/arc'
import { shortAddress } from '@/lib/format'

/** Shortened address with copy and explorer actions. */
export function AddressLink({ address }: { address: Address }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="mono text-sm tabular-nums text-ink-2" title={address}>
        {shortAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? 'Address copied' : 'Copy address'}
        className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-surface hover:text-ink"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
      <a
        href={explorerAddressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on Arc explorer"
        className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-surface hover:text-ink"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </span>
  )
}
