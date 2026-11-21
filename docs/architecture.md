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
| Shell, navigation, header, network status, wallet | Done |
| Swap Explorer: live token facts, amount entry, slippage chips, flow explainer | Done (no quote, no swap) |
| Guestbook: form, list, loading/empty/error states | Done, gated until a contract address is set |
| Guestbook contract | Not written or deployed |
| Uniswap quoting and swap execution | Not started |

## Next steps

1. Confirm Uniswap deployment addresses on Arc Testnet from an official source, then add a read-only quote.
2. Write, test and audit the Guestbook contract, deploy to Arc Testnet, set `VITE_GUESTBOOK_ADDRESS`.
3. Decide whether swap execution is in scope; if so, add allowance and swap steps with real transaction states.
