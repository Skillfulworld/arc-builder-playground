/**
 * Read-only Uniswap v4 quoting on Arc Testnet (chain 5042002).
 *
 * Addresses come from the Uniswap reference in Arc Studio's skill library. They were
 * checked against Arc Testnet itself: each has contract code there, and the Quoter and
 * StateView both report this PoolManager. Uniswap does not list Arc Testnet as a
 * supported network, so this is an educational, read-only integration. Nothing here
 * approves tokens or sends a transaction.
 */
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  encodeAbiParameters,
  http,
  isAddressEqual,
  keccak256,
  parseAbi,
  parseAbiParameters,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem'
import { arcTestnet } from 'viem/chains'

export const uniswapClient = createPublicClient({ chain: arcTestnet, transport: http() })

export const V4 = {
  poolManager: '0x8366a39CC670B4001A1121B8F6A443A643e40951',
  stateView: '0xF3334192D15450CdD385c8B70e03f9A6bD9E673b',
  quoter: '0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94',
} as const satisfies Record<string, Address>

/** The four standard fee tiers, with the tick spacing Uniswap pairs with each. */
export const FEE_TIERS = [
  { fee: 100, tickSpacing: 1 },
  { fee: 500, tickSpacing: 10 },
  { fee: 3000, tickSpacing: 60 },
  { fee: 10000, tickSpacing: 200 },
] as const

/** Price impact above this shows a warning; above the second value an execution path would block. */
export const IMPACT_WARN = 0.01
export const IMPACT_BLOCK = 0.05
/** At or above this impact the pool has effectively run out of liquidity (the Quoter returns a partial fill). */
export const PARTIAL_FILL_IMPACT = 0.9

const stateViewAbi = parseAbi([
  'function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity(bytes32 poolId) view returns (uint128)',
  'function poolManager() view returns (address)',
])
const quoterAbi = parseAbi([
  'function poolManager() view returns (address)',
  'function quoteExactInputSingle(((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint128 exactAmount, bytes hookData)) returns (uint256 amountOut, uint256 gasEstimate)',
])

export interface PoolKey {
  currency0: Address
  currency1: Address
  fee: number
  tickSpacing: number
  hooks: Address
}

export type PoolStatus = 'not-initialized' | 'empty' | 'live'

export interface PoolInfo {
  key: PoolKey
  poolId: Hex
  status: PoolStatus
  /** Raw Uniswap liquidity units (L), not a dollar value. */
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
  protocolFee: number
  lpFee: number
}

export interface Deployment {
  quoterDeployed: boolean
  stateViewDeployed: boolean
  rolesMatch: boolean
}

export type TierQuote = { fee: number; outcome: 'quoted'; amountOut: bigint } | { fee: number; outcome: 'reverted' }

export interface UniswapQuote {
  pool: PoolInfo
  amountIn: bigint
  amountOut: bigint
  /** Gas the pool swap itself would use, from the Quoter. Excludes any approval. */
  gasUnits: bigint
  /** Total fee charged by the pool, as a fraction (0.003 = 0.30%). */
  feeFraction: number
  /** Output per input at the pool's current price, before fees, in raw token units. */
  midPriceRaw: number
  /** 0 to 1. Compared with the fee-free mid price so the pool fee is not counted as impact. */
  priceImpact: number
  tiers: TierQuote[]
  pools: PoolInfo[]
  blockNumber: bigint
  fetchedAt: number
}

export type QuoteResult =
  | { kind: 'ok'; quote: UniswapQuote }
  | { kind: 'no-route'; pools: PoolInfo[]; blockNumber: bigint }
  | { kind: 'insufficient-liquidity'; pools: PoolInfo[]; tiers: TierQuote[]; blockNumber: bigint }

const isRevert = (error: unknown) =>
  error instanceof BaseError && error.walk((e) => e instanceof ContractFunctionRevertedError) !== null

const safe = async <T>(run: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await run()
  } catch {
    return undefined
  }
}

/** Confirms the Quoter and StateView exist on Arc Testnet and point at the expected PoolManager. */
export async function checkDeployment(): Promise<Deployment> {
  const [quoterCode, stateViewCode, quoterPm, stateViewPm] = await Promise.all([
    uniswapClient.getCode({ address: V4.quoter }),
    uniswapClient.getCode({ address: V4.stateView }),
    safe(() => uniswapClient.readContract({ address: V4.quoter, abi: quoterAbi, functionName: 'poolManager' })),
    safe(() => uniswapClient.readContract({ address: V4.stateView, abi: stateViewAbi, functionName: 'poolManager' })),
  ])
  const hasCode = (code: Hex | undefined) => code !== undefined && code !== '0x'
  return {
    quoterDeployed: hasCode(quoterCode),
    stateViewDeployed: hasCode(stateViewCode),
    rolesMatch:
      quoterPm !== undefined &&
      stateViewPm !== undefined &&
      isAddressEqual(quoterPm, V4.poolManager) &&
      isAddressEqual(stateViewPm, V4.poolManager),
  }
}

const poolIdOf = (key: PoolKey): Hex =>
  keccak256(
    encodeAbiParameters(parseAbiParameters('address,address,uint24,int24,address'), [
      key.currency0,
      key.currency1,
      key.fee,
      key.tickSpacing,
      key.hooks,
    ]),
  )

/** Reads every standard hookless fee tier for the pair. Hooked pools are not discovered. */
export async function readPools(tokenA: Address, tokenB: Address): Promise<PoolInfo[]> {
  const [currency0, currency1] = BigInt(tokenA) < BigInt(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
  return Promise.all(
    FEE_TIERS.map(async ({ fee, tickSpacing }): Promise<PoolInfo> => {
      const key: PoolKey = { currency0, currency1, fee, tickSpacing, hooks: zeroAddress }
      const poolId = poolIdOf(key)
      const [slot0, liquidity] = await Promise.all([
        uniswapClient.readContract({ address: V4.stateView, abi: stateViewAbi, functionName: 'getSlot0', args: [poolId] }),
        uniswapClient.readContract({ address: V4.stateView, abi: stateViewAbi, functionName: 'getLiquidity', args: [poolId] }),
      ])
      const status: PoolStatus = slot0[0] === 0n ? 'not-initialized' : liquidity === 0n ? 'empty' : 'live'
      return { key, poolId, status, liquidity, sqrtPriceX96: slot0[0], tick: slot0[1], protocolFee: slot0[2], lpFee: slot0[3] }
    }),
  )
}

/** Total fee fraction for a swap direction: protocol + LP fee, combined as Uniswap does. */
export function feeFraction(pool: PoolInfo, zeroForOne: boolean): number {
  const protocolPips = zeroForOne ? pool.protocolFee & 0xfff : pool.protocolFee >> 12
  const total = protocolPips + pool.lpFee - (protocolPips * pool.lpFee) / 1_000_000
  return total / 1e6
}

/** Raw price (token1 base units per token0 base unit) from sqrtPriceX96. */
export const rawPrice = (sqrtPriceX96: bigint) => (Number(sqrtPriceX96) / 2 ** 96) ** 2

/** Rough in-range reserves implied by the current price and liquidity. An estimate, not a balance. */
export function virtualReserves(pool: PoolInfo): { amount0Raw: number; amount1Raw: number } {
  const sqrt = Number(pool.sqrtPriceX96) / 2 ** 96
  const liquidity = Number(pool.liquidity)
  return { amount0Raw: liquidity / sqrt, amount1Raw: liquidity * sqrt }
}

/**
 * Quotes every live pool for the pair with the Quoter (a simulated call that never sends
 * a transaction) and returns the best output, with price impact against the mid price.
 */
export async function quoteBest(tokenIn: Address, tokenOut: Address, amountIn: bigint): Promise<QuoteResult> {
  const [pools, blockNumber] = await Promise.all([readPools(tokenIn, tokenOut), uniswapClient.getBlockNumber()])
  const live = pools.filter((pool) => pool.status === 'live')
  if (live.length === 0) return { kind: 'no-route', pools, blockNumber }

  const results = await Promise.all(
    live.map(async (pool) => {
      const zeroForOne = BigInt(tokenIn) === BigInt(pool.key.currency0)
      try {
        const { result } = await uniswapClient.simulateContract({
          address: V4.quoter,
          abi: quoterAbi,
          functionName: 'quoteExactInputSingle',
          args: [{ poolKey: pool.key, zeroForOne, exactAmount: amountIn, hookData: '0x' }],
        })
        return { pool, zeroForOne, amountOut: result[0], gasUnits: result[1] }
      } catch (error) {
        if (isRevert(error)) return { pool, zeroForOne, amountOut: undefined, gasUnits: 0n }
        throw error
      }
    }),
  )

  const tiers: TierQuote[] = results.map((r) =>
    r.amountOut !== undefined && r.amountOut > 0n
      ? { fee: r.pool.key.fee, outcome: 'quoted', amountOut: r.amountOut }
      : { fee: r.pool.key.fee, outcome: 'reverted' },
  )
  const filled = results.filter((r): r is typeof r & { amountOut: bigint } => r.amountOut !== undefined && r.amountOut > 0n)
  if (filled.length === 0) return { kind: 'insufficient-liquidity', pools, tiers, blockNumber }

  const best = filled.reduce((a, b) => (b.amountOut > a.amountOut ? b : a))
  const fee = feeFraction(best.pool, best.zeroForOne)
  const price = rawPrice(best.pool.sqrtPriceX96)
  const midPriceRaw = best.zeroForOne ? price : 1 / price
  const expected = Number(amountIn) * midPriceRaw * (1 - fee)

  const priceImpact = expected > 0 ? Math.max(0, 1 - Number(best.amountOut) / expected) : 0
  if (priceImpact >= PARTIAL_FILL_IMPACT) return { kind: 'insufficient-liquidity', pools, tiers, blockNumber }

  return {
    kind: 'ok',
    quote: {
      pool: best.pool,
      amountIn,
      amountOut: best.amountOut,
      gasUnits: best.gasUnits,
      feeFraction: fee,
      midPriceRaw,
      priceImpact,
      tiers,
      pools,
      blockNumber,
      fetchedAt: Date.now(),
    },
  }
}
