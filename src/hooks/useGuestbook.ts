import { useQuery } from '@tanstack/react-query'
import type { Hex } from 'viem'
import { useReadContract } from 'wagmi'
import { ARC_CHAIN_ID } from '@/lib/arc'
import { GUESTBOOK_DEPLOYMENT } from '@/lib/deployments'
import { GUESTBOOK_ADDRESS } from '@/lib/env'
import { guestbookAbi, messageAddedEvent, PAGE_SIZE } from '@/lib/guestbook'
import { uniswapClient as arcPublicClient } from '@/lib/uniswap'

/**
 * Loads the most recent guestbook messages straight from the deployed contract, newest first,
 * and looks up each message's transaction hash from its MessageAdded event.
 */
export function useGuestbookMessages() {
  const count = useReadContract({
    address: GUESTBOOK_ADDRESS,
    abi: guestbookAbi,
    functionName: 'messageCount',
    chainId: ARC_CHAIN_ID,
    query: { refetchInterval: 8000 },
  })

  const total = count.data ?? 0n
  const limit = total < PAGE_SIZE ? total : PAGE_SIZE
  const offset = total - limit

  const list = useReadContract({
    address: GUESTBOOK_ADDRESS,
    abi: guestbookAbi,
    functionName: 'getMessages',
    args: [offset, limit],
    chainId: ARC_CHAIN_ID,
    query: { enabled: count.data !== undefined && total > 0n },
  })

  // Ids are positions in the contract's history; newest first for display.
  const entries = list.data
    ? list.data.map((message, index) => ({ id: offset + BigInt(index), message })).reverse()
    : []
  const idKey = entries.map((entry) => entry.id.toString()).join(',')

  const receipts = useQuery({
    queryKey: ['guestbook-tx', GUESTBOOK_ADDRESS, idKey],
    enabled: entries.length > 0,
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const logs = await arcPublicClient.getLogs({
        address: GUESTBOOK_ADDRESS,
        event: messageAddedEvent,
        args: { id: entries.map((entry) => entry.id) },
        fromBlock: GUESTBOOK_DEPLOYMENT.deployBlock,
        toBlock: 'latest',
      })
      const byId: Record<string, Hex> = {}
      for (const log of logs) {
        if (log.args.id !== undefined && log.transactionHash) byId[log.args.id.toString()] = log.transactionHash
      }
      return byId
    },
  })

  const refetch = () => {
    void (async () => {
      const latest = await count.refetch()
      if ((latest.data ?? 0n) > 0n) await list.refetch()
    })()
  }

  return {
    total,
    entries,
    /** Transaction hash per message id, when the event lookup succeeded. */
    txHashes: receipts.data,
    txLookupFailed: receipts.isError,
    isLoading: count.isLoading || list.isLoading,
    isError: count.isError || list.isError,
    refetch,
  }
}
