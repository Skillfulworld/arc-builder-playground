# Arc Builder Playground: architecture and plan

An educational prototype showing how a natural-language idea becomes a working onchain app on Arc Testnet. It is not a production financial application.

## Product shape

Two independent sections inside one dashboard shell, routed by path (`/swap`, `/guestbook`):

1. **Swap Explorer**: two modes on Arc Testnet. **Uniswap quotes** (default) is a read-only Uniswap v4 explorer: live quotes, pools, fees, price impact and a plain-English review, with approvals and swaps disabled. **Testnet swap** is a wallet-signed swap routed by Circle's App Kit swap service (see `docs/uniswap-research.md` for why that one is not a direct Uniswap swap).
2. **Onchain Guestbook**: connect a wallet, publish a public message, read messages stored in a contract.

## Stack

React 18, Vite, TypeScript, Tailwind CSS, wagmi v2, viem, ConnectKit. Arc Dark visual mode. Injected wallets only.

## Source layout

```
src/
  App.tsx                     composition root: shell + active section
  hooks/                      useSection (router), useToken (ERC-20 reads), useGuestbook (contract reads)
  lib/                        arc (chain facts), tokens, env (optional addresses), guestbook (ABI), format, cn
  components/
    layout/                   Header, Sidebar, MobileTabs, AppShell, NetworkStatus, WalletButton
    ui/                       Card, Button, Badge, Notice, SectionHeader, SetupChecklist, AddressLink
    swap/                     SwapExplorer, SwapCard, TokenFactCard, SwapFlow, TokenIcon
    guestbook/                Guestbook, MessageForm, MessageList, ContractPlan
```

## Data and trust rules

- Chain ID, RPC and explorer come from viem's `arcTestnet`. Nothing is typed by hand.
- USDC and cirBTC testnet addresses come from the Arc contract-address docs and are re-read from the chain (symbol, decimals, supply) on every load; the UI flags a mismatch.
- USDC is shown only in its 6-decimal ERC-20 view. The native 18-decimal view is never displayed or summed.
- The Guestbook address is an optional env var (`VITE_GUESTBOOK_ADDRESS`). When unset, the UI says "not configured" instead of inventing anything.
- Swap quotes and execution come from Circle App Kit (`kit.estimateSwap`, `kit.swap`) on `Arc_Testnet`, keyless from the browser. No router or pool address is typed in the app.
- No prices, quotes, balances or hashes are simulated.

## Status of this build

| Area | State |
| --- | --- |
| Shell, navigation, header, environment banner | Done |
| Wallet: injected wallets via ConnectKit, address menu with disconnect, network guard (Arc Testnet only) | Done |
| Swap Explorer, Uniswap quotes tab: v4 Quoter quotes, pool tiers and depth, fees, price impact, plain-English review, execution disabled | Done, read-only |
| Swap Explorer, Testnet swap tab: live quote, fee review, confirmation, wallet-signed swap via App Kit | Done on Arc Testnet (`SWAP_ENABLED` in `src/lib/env.ts`) |
| Guestbook: form, entries with address, time and transaction link, pending/confirmed/failed states, refresh after posting | Done and live on Arc Testnet (`0xdb1b657b487c81f68c3613fe4462c121f4ddc3c3`) |
| Guestbook contract | Not written or deployed |
| Direct Uniswap swap execution | Not built: no supported Uniswap router on Arc Testnet (see the Uniswap tab for what is still needed) |

## Environments

Arc Testnet is the only configured chain; mainnets are not in the wagmi config, so a wallet on any other network is shown as unsupported with a switch prompt. Two switches in `src/lib/env.ts` control transactions: `SWAP_ENABLED` (testnet swaps) and `GUESTBOOK_WRITES_ENABLED` (guestbook posts). Both are on; each send needs wallet approval.

## Uniswap quotes (read-only)

- Reads the Uniswap v4 StateView and Quoter on Arc Testnet through the public RPC; no wallet is needed. Pool state, quotes, fees, gas units and price impact are all read or computed from chain data.
- Checks the four standard hookless fee tiers for USDC/cirBTC. Hooked pools are not discovered.
- Price impact is measured against the pool's fee-free mid price. At 90% impact or more the quote is shown as insufficient liquidity (the Quoter returns a partial fill).
- Addresses (PoolManager, StateView, Quoter) come from the Uniswap reference in the skill library and were verified on Arc Testnet: each has code and the Quoter and StateView report the expected PoolManager. The app re-checks this on load.
- Uniswap does not list Arc Testnet as supported. The tab says so and never claims these are market prices.

## Swap behaviour and limits (Testnet swap tab)

- The quote needs a connected wallet on Arc Testnet. The swap runs only from the Swap button click, with the exact tokens and amount of the displayed quote.
- Routing is chosen by the swap service (the 1 USDC test quote came back through the `lifi` provider), not by this app.
- Testnet liquidity is thin: a 25 USDC quote returned no route at the time of writing, while 1 USDC did. Default slippage is 3% and can be raised to 10%.

## Next steps

1. Optionally add a price-impact warning once a reference price source is chosen.
