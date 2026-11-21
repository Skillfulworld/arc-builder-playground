import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { GUESTBOOK_ADDRESS, GUESTBOOK_WRITES_ENABLED } from '@/lib/env'
import { describeTxError, guestbookAbi } from '@/lib/guestbook'

export type PublishStatus = 'idle' | 'awaiting-wallet' | 'confirming' | 'success' | 'error'

/**
 * Publishing state for the guestbook. A message is sent only from the Publish click, to the
 * deployed contract, after the wallet owner approves it.
 */
export function usePublishMessage() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error, reset, variables } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: ARC_CHAIN_ID })

  const canSend = GUESTBOOK_WRITES_ENABLED

  let status: PublishStatus = 'idle'
  if (isPending) status = 'awaiting-wallet'
  else if (receipt.isError || error) status = 'error'
  else if (receipt.isSuccess) status = 'success'
  else if (hash) status = 'confirming'

  // A transaction that was mined but reverted is a failure too, even though the receipt loaded.
  const reverted = receipt.data?.status === 'reverted'
  if (reverted) status = 'error'

  const errorMessage =
    status === 'error'
      ? reverted
        ? 'The transaction was mined but the contract rejected it. Check the message and try again.'
        : describeTxError(receipt.error ?? error)
      : null

  const publish = (text: string) => {
    if (!canSend) return
    reset()
    writeContract({
      address: GUESTBOOK_ADDRESS,
      abi: guestbookAbi,
      functionName: 'addMessage',
      args: [text],
      chainId: ARC_CHAIN_ID,
    })
  }

  return {
    canSend,
    status,
    hash,
    author: address,
    /** Text of the message being published, while it is in flight or just confirmed. */
    pendingText: status === 'idle' || status === 'error' ? undefined : variables?.args?.[0],
    errorMessage,
    publish,
    reset,
  }
}

export type PublishState = ReturnType<typeof usePublishMessage>
