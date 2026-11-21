import { useEffect, useRef, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { ExternalLink } from 'lucide-react'
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Notice } from '@/components/ui/Notice'
import { ARC_CHAIN_ID, explorerTxUrl } from '@/lib/arc'
import { cn } from '@/lib/cn'
import { GUESTBOOK_ADDRESS } from '@/lib/env'
import { byteLength, describeTxError, guestbookAbi, MAX_MESSAGE_BYTES } from '@/lib/guestbook'

export function MessageForm({ onPosted }: { onPosted: () => void }) {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const [text, setText] = useState('')

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash, chainId: ARC_CHAIN_ID })

  const onPostedRef = useRef(onPosted)
  useEffect(() => {
    onPostedRef.current = onPosted
  })

  useEffect(() => {
    if (isSuccess) onPostedRef.current()
  }, [isSuccess])

  // After a confirmed post the box reads as empty; typing again clears the receipt.
  const current = isSuccess ? '' : text
  const bytes = byteLength(current)
  const tooLong = bytes > MAX_MESSAGE_BYTES
  const trimmed = current.trim()
  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID
  const busy = isPending || confirming
  const errorText = error ? describeTxError(error) : null

  const submit = () => {
    if (!GUESTBOOK_ADDRESS || !trimmed || tooLong) return
    reset()
    writeContract({
      address: GUESTBOOK_ADDRESS,
      abi: guestbookAbi,
      functionName: 'postMessage',
      args: [trimmed],
      chainId: ARC_CHAIN_ID,
    })
  }

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
            if (isSuccess) reset()
            setText(event.target.value)
          }}
          disabled={!GUESTBOOK_ADDRESS || busy}
          rows={4}
          placeholder={GUESTBOOK_ADDRESS ? 'Write something for the chain to remember…' : 'Available once the contract is deployed'}
          aria-invalid={tooLong}
          className="w-full resize-none rounded-2xl border border-line bg-canvas/40 p-4 text-base text-ink outline-none transition focus:border-line-strong disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-subtle">Public and permanent. Anyone can read it.</span>
          <span className={cn('tabular-nums', tooLong ? 'text-danger' : 'text-subtle')}>
            {bytes} / {MAX_MESSAGE_BYTES} bytes
          </span>
        </div>
      </div>

      {!isConnected ? (
        <ConnectKitButton.Custom>
          {({ show }) => (
            <Button onClick={show} className="w-full">
              Connect wallet
            </Button>
          )}
        </ConnectKitButton.Custom>
      ) : wrongNetwork ? (
        <Button onClick={() => switchChain({ chainId: ARC_CHAIN_ID })} loading={switching} className="w-full">
          Switch to Arc Testnet
        </Button>
      ) : (
        <Button onClick={submit} disabled={!GUESTBOOK_ADDRESS || !trimmed || tooLong} loading={busy} className="w-full">
          {!GUESTBOOK_ADDRESS
            ? 'Contract not deployed yet'
            : isPending
              ? 'Confirm in your wallet…'
              : confirming
                ? 'Publishing…'
                : 'Publish message'}
        </Button>
      )}

      {errorText && <Notice tone="danger">{errorText}</Notice>}

      {isSuccess && hash && (
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
