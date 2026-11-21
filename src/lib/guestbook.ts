/**
 * Proposed interface for the Onchain Guestbook contract.
 * The contract is written and deployed in a later step; this ABI will be
 * regenerated from the compiled artifact so the frontend always matches it.
 */

/** Maximum message size in bytes. The contract must enforce the same limit. */
export const MAX_MESSAGE_BYTES = 280

/** Number of recent messages loaded per page. */
export const PAGE_SIZE = 20n

export const guestbookAbi = [
  {
    type: 'function',
    name: 'messageCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getMessages',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'author', type: 'address' },
          { name: 'timestamp', type: 'uint64' },
          { name: 'text', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'postMessage',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'text', type: 'string' }],
    outputs: [],
  },
] as const

export const byteLength = (text: string) => new TextEncoder().encode(text).length

/** Turn a wallet or RPC error into plain language. Returns null when the user simply cancelled. */
export function describeTxError(error: unknown): string | null {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
  if (message.includes('user rejected') || message.includes('user denied')) return null
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Not enough USDC to pay for gas. Get test USDC from the faucet and try again.'
  }
  if (message.includes('reverted')) return 'The contract rejected this message. Check its length and try again.'
  if (message.includes('network') || message.includes('timeout')) return 'Network issue. Check your connection and retry.'
  return 'Something went wrong. Please try again.'
}
