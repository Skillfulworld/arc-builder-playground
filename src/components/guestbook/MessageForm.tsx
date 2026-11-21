import { useEffect, useRef, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { useNetwork } from '@/hooks/useNetwork'
import type { PublishState } from '@/hooks/usePublishMessage'
import { explorerTxUrl } from '@/lib/arc'
import { cn } from '@/lib/cn'
import { GUESTBOOK_ADDRESS } from '@/lib/env'
import { byteLength, MAX_MESSAGE_BYTES } from '@/lib/guestbook'

interface MessageFormProps {
  publish: PublishState
  onPosted: () => void
}

export function MessageForm({ publish, onPosted }: MessageFormProps) {
  const network = useNetwork()
  const [text, setText] = useState('')
  const { status, hash, canSend } = publish

  const onPostedRef = useRef(onPosted)
  useEffect(() => {
    onPostedRef.current = onPosted
  })
  useEffect(() => {
    if (status === 'success') onPostedRef.current()
  }, [status])

  // After a confirmed post the box reads as empty; typing again clears the receipt.
  const current = status === 'success' ? '' : text
  const bytes = byteLength(current)
  const tooLong = bytes > MAX_MESSAGE_BYTES
  const trimmed = current.trim()
  const busy = status === 'awaiting-wallet' || status === 'confirming'

  const disabledReason = !GUESTBOOK_ADDRESS
    ? 'Contract not deployed yet'
    : !canSend
      ? 'Publishing is switched off'
      : null

  return (
    <Card strong className="space-y-4">
      <CardTitle className="text-xl">Sign the guestbook</CardTitle>

      <div>
        <label htmlFor="guestbook-message" className="sr-only">
          Your message
        </label>
        <textarea
          id="guestbook-message"
          value={current}
          onChange={(event) => {
            if (status === 'success') publish.reset()
            setText(event.target.value)
          }}
          disabled={busy}
          rows={4}
          placeholder="Write something for the chain to remember…"
          aria-invalid={tooLong}
          aria-describedby="guestbook-help"
          className="w-full resize-none rounded-2xl border border-line bg-canvas/40 p-4 text-base text-ink outline-none transition focus:border-line-strong disabled:opacity-60"
        />
        <div id="guestbook-help" className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-subtle">Public and permanent. Anyone can read it.</span>
          <span className={cn('shrink-0 tabular-nums', tooLong ? 'text-danger' : 'text-subtle')}>
            {bytes} / {MAX_MESSAGE_BYTES} bytes
          </span>
        </div>
      </div>

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
        <Button
          onClick={() => publish.publish(trimmed)}
          disabled={Boolean(disabledReason) || !trimmed || tooLong}
          loading={busy}
          className="w-full"
        >
          {disabledReason ??
            (status === 'awaiting-wallet' ? 'Confirm in your wallet…' : status === 'confirming' ? 'Publishing…' : 'Publish message')}
        </Button>
      )}

      {disabledReason && network.isReady && (
        <p className="text-pretty text-center text-xs text-subtle">
          {GUESTBOOK_ADDRESS
            ? 'Transactions are switched off at this stage, so nothing can be sent.'
            : 'Set VITE_GUESTBOOK_ADDRESS after the contract is deployed. Nothing can be sent until then.'}
        </p>
      )}

      {status === 'error' && publish.errorMessage && <Notice tone="danger">{publish.errorMessage}</Notice>}

      {status === 'success' && hash && (
        <Notice>
          Message published.{' '}
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-accent underline-offset-2 hover:underline"
          >
            View transaction <ExternalLink className="size-3" aria-hidden />
          </a>
        </Notice>
      )}
    </Card>
  )
}
