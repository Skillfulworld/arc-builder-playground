/**
 * Interface of contracts/Guestbook.sol, kept in step with the contract.
 * The contract is reviewed and tested but not deployed yet; after deployment this
 * ABI can be regenerated from the compiled artifact.
 */

/** Maximum message length in characters (Unicode code points), enforced by the contract. */
export const MAX_MESSAGE_LENGTH = 280

/** Hard byte ceiling enforced by the contract (280 characters at up to 4 bytes each). */
export const MAX_MESSAGE_BYTES = 1120

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
    name: 'addMessage',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'text', type: 'string' }],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  { type: 'error', name: 'EmptyMessage', inputs: [] },
  {
    type: 'error',
    name: 'MessageTooLong',
    inputs: [
      { name: 'length', type: 'uint256' },
      { name: 'max', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'MessageTooManyBytes',
    inputs: [
      { name: 'length', type: 'uint256' },
      { name: 'max', type: 'uint256' },
    ],
  },
  { type: 'error', name: 'InvalidUTF8', inputs: [] },
  { type: 'error', name: 'MessageNotFound', inputs: [{ name: 'id', type: 'uint256' }] },
  {
    type: 'error',
    name: 'PageSizeTooLarge',
    inputs: [
      { name: 'limit', type: 'uint256' },
      { name: 'max', type: 'uint256' },
    ],
  },
] as const

export const byteLength = (text: string) => new TextEncoder().encode(text).length

/** Characters as the contract counts them: Unicode code points, not UTF-16 units. */
export const characterCount = (text: string) => Array.from(text).length

/** Turn a wallet or RPC error into plain language. Returns null when the user simply cancelled. */
export function describeTxError(error: unknown): string | null {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
  if (message.includes('user rejected') || message.includes('user denied')) return null
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Not enough USDC to pay for gas. Get test USDC from the faucet and try again.'
  }
  if (message.includes('emptymessage')) return 'The message is empty. Write something first.'
  if (message.includes('messagetoolong') || message.includes('messagetoomanybytes')) {
    return `The message is too long. The limit is ${MAX_MESSAGE_LENGTH} characters.`
  }
  if (message.includes('invalidutf8')) return 'The message contains characters that cannot be stored. Remove them and try again.'
  if (message.includes('reverted')) return 'The contract rejected this message. Check its length and try again.'
  if (message.includes('network') || message.includes('timeout')) return 'Network issue. Check your connection and retry.'
  return 'Something went wrong. Please try again.'
}
