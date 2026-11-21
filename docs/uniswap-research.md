# Uniswap on Arc: research findings (Arc Testnet only)

Scope: USDC and cirBTC swap support for the Swap Explorer. Everything below was read from **Arc Testnet (chain 5042002)** using read-only calls (`eth_getCode`, `eth_call`, simulated quoter calls). Nothing was sent, approved, signed or deployed, and no mainnet endpoint was used.

- Checked at: testnet block 73,323,373 (2026-11-21).
- Legend: **[VERIFIED]** read from the chain in this session. **[DOCS]** taken from the Uniswap reference in Arc Studio's skill library, not verified by me. **[ESTIMATE]** computed from verified values. **[UNAVAILABLE]** could not be determined.

## 1. Headline

Uniswap is **not a supported deployment on Arc Testnet** [DOCS: the skill reference states Uniswap's team does not support it and that v2, v3, UniswapX and Universal Router 2.1.2 are not deployed there]. [VERIFIED] The partial deployment found on testnet confirms this: only v4 core contracts, an old router and Permit2 have code. There is **one live USDC/cirBTC pool**, and it is far too shallow for consumer-sized swaps.

## 2. Contract availability on Arc Testnet [VERIFIED]

Addresses are the ones published in the skill reference; the check was whether code exists on testnet.

| Contract | Address | Testnet |
| --- | --- | --- |
| v4 PoolManager | `0x8366a39CC670B4001A1121B8F6A443A643e40951` | code present |
| v4 StateView | `0xF3334192D15450CdD385c8B70e03f9A6bD9E673b` | code present; `poolManager()` returns the PoolManager |
| v4 Quoter | `0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94` | code present; `poolManager()` returns the PoolManager |
| v4 PositionManager | `0x6049c9a0e26405C0985f9E3685C87d0aE917f82B` | code present |
| Universal Router 2.1.2 (current) | `0x8702463e73f74d0b6765aBceb314Ef07aCb92650` | **no code** |
| Universal Router 2.1.1 | `0x4fca4a51ab4f23a7447b3284fbd7d73289a89fb1` | code present, but support ended 2026-10-21 [DOCS] |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | code present (canonical address, says nothing about Uniswap) |
| v3 Factory / SwapRouter02 / QuoterV2 / PositionManager | see skill reference | **no code**; v3 `getPool` returns no data |
| v2 Factory / Router02 | see skill reference | **no code** |
| UniswapX OrderQuoter | `0x00000000a3db63Df9078cBF3dF88B4CAdD5a7F58` | **no code** |

Consequences: there is no v3 factory to query, and no supported router on testnet. v4 has no factory: pools live inside the PoolManager and are read through StateView.

## 3. Pools for USDC and cirBTC [VERIFIED]

Tokens: USDC `0x3600000000000000000000000000000000000000` (6 decimals, currency0), cirBTC `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF` (8 decimals, currency1).

Hookless v4 pools checked at the four standard tiers:

| Fee / tick spacing | Initialized | Liquidity (raw L) |
| --- | --- | --- |
| 0.01% / 1 | no | 0 |
| 0.05% / 10 | no | 0 |
| **0.30% / 60** | **yes** | **884,452** |
| 1.00% / 200 | no | 0 |

- Live pool: poolId `0xf4e18ec272549ab0140d43d33a7ba93768ecaec4dee4a7fb4f2c9af00950cde4`, LP fee 3000 pips, protocol fee 0, tick -67167, sqrtPriceX96 `2757083308794358158811326814`.
- Mid price [ESTIMATE from sqrtPriceX96]: about 0.0000121099 cirBTC per USDC, i.e. about 82,577 USDC per cirBTC.
- Depth [ESTIMATE]: at the current price the in-range virtual reserves are only about 25.4 USDC and 0.000308 cirBTC. The PoolManager holds about 4,905 USDC and 0.000218 cirBTC across all v4 pools combined (a ceiling, not this pool's balance).
- Pools with a hooks address [UNAVAILABLE]: they cannot be enumerated from the standard fee tiers, and a full-history `getLogs` on the PoolManager was rejected by the RPC, so hooked pools were not checked.

## 4. Pool suitable for small consumer swaps

**None.** The only live pool (0.30%) is too shallow. Live quotes [VERIFIED, v4 Quoter simulation]:

| Input | Output | Price impact vs fee-adjusted mid [ESTIMATE] |
| --- | --- | --- |
| 1 USDC | 0.00001161 cirBTC | about 3.8% |
| 5 USDC | 0.00004758 cirBTC | about 21% |
| 10 USDC | 0.00007054 cirBTC | about 42% |
| 25 USDC | 0.00009702 cirBTC | about 68% |

The skill's rules warn above 1% impact and block above 5%, so everything above roughly 0.2 USDC would be warned and 25 USDC would be blocked.

## 5. Quotes requested

| Request | Result |
| --- | --- |
| 25 USDC to cirBTC (exact in) | **0.00009702 cirBTC** [VERIFIED]. Impact about 68% [ESTIMATE]. Quoter gas estimate 69,181. |
| Reverse: 0.00030274 cirBTC (about 25 USDC at mid price) to USDC (exact in) | **7.967364 USDC** [VERIFIED]. About 68% below 25 USDC [ESTIMATE]. |
| Exact out: 25 USDC, cirBTC needed | **reverted** (pool cannot fill that size) [VERIFIED] |

These numbers are live-pool simulations only and will change with pool state. Do not reuse them.

## 6. Call structure (from the skill reference [DOCS]; the quoter signature was confirmed working on testnet)

Quote (v4 Quoter, called via `eth_call` / `simulateContract`, never in a sent transaction):

```
quoteExactInputSingle(((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint128 exactAmount, bytes hookData)) returns (uint256 amountOut, uint256 gasEstimate)
quoteExactOutputSingle(same params) returns (uint256 amountIn, uint256 gasEstimate)
```

Pool state (StateView):

```
getSlot0(bytes32 poolId) returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)
getLiquidity(bytes32 poolId) returns (uint128)
poolId = keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
```

Approvals: two steps through Permit2. (1) `ERC20.approve(Permit2, amount)`. (2) A signed EIP-712 `PermitSingle` redeemed inside the router call, or `Permit2.approve(token, router, amount, expiration)`. USDC's own EIP-2612 `permit` is a different mechanism and the router does not use it.

Swap: `execute(bytes commands, bytes[] inputs, uint256 deadline)` on the Universal Router, `value` always 0. For v4: command `V4_SWAP` (0x10) with actions `SWAP_EXACT_IN_SINGLE` (0x06), `SETTLE_ALL` (0x0c), `TAKE_ALL` (0x0f). Router 2.1.x swap inputs carry `minHopPriceX36`. Deadline is a timestamp (latest block time plus about 1200 s). Slippage bound comes from the quote, default 0.5%, hard cap 1%.

**Blocker:** the supported router (2.1.2) has no code on testnet, and 2.1.1 is unsupported. A swap path cannot be built on testnet with a supported router.

## 7. Arc-specific transaction and gas notes

- [VERIFIED, testnet] Base fee 20 gwei; fee estimate `maxFeePerGas` 29 gwei, priority 5 gwei, gas price 25 gwei.
- [DOCS] Never set `maxFeePerGas` below 20 gwei, or the transaction is rejected or dropped without a receipt.
- [DOCS] USDC is the gas token: no WETH9, no wrapping, every swap has `value: 0`. Reject the `0x0` native sentinel.
- [DOCS] Two USDC views: native 18 decimals (gas only) and ERC-20 6 decimals (swap amounts, balances). Parse with `decimals()`.
- [DOCS] Blocks are about 0.5 s apart; express deadlines in seconds.
- [DOCS] Gas preview figures (measured on mainnet by the skill authors, not by me): about 56k for the approve, 200k to 210k for a permit-and-swap.

## 8. Limitations and risks

1. Uniswap does not support Arc Testnet; the skill says never to build a Uniswap flow on it. Any testnet swap UI would sit on an unsupported deployment.
2. The single live pool is a few dollars deep. 25 USDC would move the price about 68%, so the app's own gate would block it.
3. No supported router on testnet, so executing a swap is not possible there.
4. Hooked pools were not enumerated.
5. Pool state can change at any time; a user (or anyone) could add or drain liquidity. Quote live every time.
6. The implied price (about 82,577 USDC per cirBTC) is a property of this test pool and should not be shown as a market price.

## 9. Options for the next step (your decision)

- **A. Read-only quote display on testnet.** Show the live 0.30% pool quote and price impact in the Swap Explorer, keep the swap button disabled, label it "unsupported test pool". Needs only `VITE_UNISWAP_QUOTER_ADDRESS` set to the v4 Quoter above. Honest, but the skill advises against building a Uniswap flow on testnet.
- **B. Own mock pool on testnet.** Deploy a simple test pool or seed liquidity to make swaps possible. This needs contract deployment and transactions, which are out of scope until you approve them.
- **C. Switch the swap section to Arc Mainnet.** Supported by Uniswap per the skill, but real funds, and you asked for nothing on mainnet. Not pursued.
