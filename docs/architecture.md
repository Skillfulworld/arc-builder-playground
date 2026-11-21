# Arc Builder Playground: architecture and plan

An educational prototype showing how a natural-language idea becomes a working onchain app on Arc Testnet. It is not a production financial application.

## Product shape

Two independent sections inside one dashboard shell, routed by path (`/swap`, `/guestbook`):

1. **Swap Explorer**: a working USDC and cirBTC swap on Arc Testnet, routed by Circle's App Kit swap service (see `docs/uniswap-research.md` for why this is not a direct Uniswap integration).
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
| Swap Explorer: token selector, live quote, fee review, confirmation, wallet-signed swap | Done on Arc Testnet (`SWAP_ENABLED` in `src/lib/env.ts`) |
| Guestbook: form, entries with address and status, pending entry, loading/empty/error states | Done, inert until a contract address is set and `GUESTBOOK_WRITES_ENABLED` is true |
| Guestbook contract | Not written or deployed |
| Direct Uniswap integration | Not used: Uniswap does not support Arc Testnet; swaps route through App Kit |

## Environments

Arc Testnet is the only configured chain; mainnets are not in the wagmi config, so a wallet on any other network is shown as unsupported with a switch prompt. Two switches in `src/lib/env.ts` control transactions: `SWAP_ENABLED` (on, testnet swaps) and `GUESTBOOK_WRITES_ENABLED` (off until the contract is deployed).

## Swap behaviour and limits

- The quote needs a connected wallet on Arc Testnet. The swap runs only from the Swap button click, with the exact tokens and amount of the displayed quote.
- Routing is chosen by the swap service (the 1 USDC test quote came back through the `lifi` provider), not by this app.
- Testnet liquidity is thin: a 25 USDC quote returned no route at the time of writing, while 1 USDC did. Default slippage is 3% and can be raised to 10%.

## Next steps

1. Write, test and audit the Guestbook contract, deploy to Arc Testnet, set `VITE_GUESTBOOK_ADDRESS`, then enable `GUESTBOOK_WRITES_ENABLED`.
2. Optionally add a price-impact warning once a reference price source is chosen.
