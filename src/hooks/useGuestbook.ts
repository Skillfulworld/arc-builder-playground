import { useReadContract } from 'wagmi'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { GUESTBOOK_ADDRESS } from '@/lib/env'
import { guestbookAbi, PAGE_SIZE } from '@/lib/guestbook'

/** Loads the most recent guestbook messages, newest first. Idle until a contract address is configured. */
export function useGuestbookMessages() {
  const enabled = Boolean(GUESTBOOK_ADDRESS)

  const count = useReadContract({
    address: GUESTBOOK_ADDRESS,
    abi: guestbookAbi,
    functionName: 'messageCount',
    chainId: ARC_CHAIN_ID,
    query: { enabled, refetchInterval: 8000 },
  })

  const total = count.data ?? 0n
  const limit = total < PAGE_SIZE ? total : PAGE_SIZE

  const list = useReadContract({
    address: GUESTBOOK_ADDRESS,
    abi: guestbookAbi,
    functionName: 'getMessages',
    args: [total - limit, limit],
    chainId: ARC_CHAIN_ID,
    query: { enabled: enabled && count.data !== undefined && total > 0n },
  })

  const refetch = () => {
    void (async () => {
      const latest = await count.refetch()
      if ((latest.data ?? 0n) > 0n) await list.refetch()
    })()
  }

  return {
    enabled,
    total,
    messages: list.data ? [...list.data].reverse() : [],
    isLoading: enabled && (count.isLoading || list.isLoading),
    isError: count.isError || list.isError,
    refetch,
  }
}
