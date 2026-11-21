# Arc Builder Playground: architecture and plan

An educational prototype showing how a natural-language idea becomes a working onchain app on Arc Testnet. It is not a production financial application.

## Product shape

Two independent sections inside one dashboard shell, routed by path (`/swap`, `/guestbook`):

1. **Swap Explorer**: a read-only preview of a USDC to cirBTC swap through Uniswap on Arc.
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
- Uniswap and Guestbook addresses are optional env vars (`VITE_UNISWAP_QUOTER_ADDRESS`, `VITE_GUESTBOOK_ADDRESS`). When unset, the UI says "not configured" instead of inventing anything.
- No prices, quotes, balances or hashes are simulated.

## Status of this build

| Area | State |
| --- | --- |
| Shell, navigation, header, environment banner | Done |
| Wallet: injected wallets via ConnectKit, address menu with disconnect, network guard (Arc Testnet only) | Done |
| Swap Explorer: token selector, amount, quote states, fee review, confirmation checklist | Done (no quote source, no swap) |
| Guestbook: form, entries with address and status, pending entry, loading/empty/error states | Done, inert until a contract address is set and `WRITES_ENABLED` is true |
| Guestbook contract | Not written or deployed |
| Uniswap quoting and swap execution | Not started |

## Environments

Arc Testnet is the only configured chain; mainnets are not in the wagmi config, so a wallet on any other network is shown as unsupported with a switch prompt. `WRITES_ENABLED` in `src/lib/env.ts` is the single switch for anything that sends a transaction and is `false` for now.

## Next steps

1. Confirm Uniswap deployment addresses on Arc Testnet from an official source, then add a read-only quote.
2. Write, test and audit the Guestbook contract, deploy to Arc Testnet, set `VITE_GUESTBOOK_ADDRESS`.
3. Decide whether swap execution is in scope; if so, add allowance and swap steps with real transaction states.
