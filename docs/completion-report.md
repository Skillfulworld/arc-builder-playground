# Arc Builder Playground: completion report

An educational onchain prototype on **Arc Testnet** (chain 5042002). Test funds only. Nothing uses Arc mainnet.

## What works

- **Onchain Guestbook (live on Arc Testnet).** Connect a browser wallet, publish a message of up to 280 characters, and read messages straight from the deployed contract. Each message shows its sender address, time, a "Confirmed onchain" badge and a link to its transaction. The list refreshes after a successful post. The form shows waiting-for-wallet, confirming, confirmed and failed states, including a transaction that was mined but reverted.
- **Swap Explorer, Uniswap quotes (read-only research).** Live quotes, pool tiers and depth, fees, price impact and a plain-English review from the Uniswap v4 contracts found on Arc Testnet. Approvals and swaps are disabled. Uniswap does not list Arc Testnet as supported, so these are test pools, not market prices.
- **Swap Explorer, Testnet swap (live on Arc Testnet).** A wallet-signed USDC and cirBTC swap routed by Circle's swap service (not Uniswap). Works for small amounts such as 1 USDC.
- **App shell.** Header with live Arc Testnet block number, wallet menu with disconnect, network guard (switch prompt on any other network), a testnet banner, and an in-app "What runs where" guide that separates live testnet features from read-only research.

## What was deployed

| | |
|---|---|
| Contract | `Guestbook` |
| Network | Arc Testnet (5042002) |
| Address | `0xdb1b657b487c81f68c3613fe4462c121f4ddc3c3` |
| Deployment transaction | `0xa1fd5b9ca90cee6447296786760015dc5a99f1551867c0d1e4f6382be7f58e58` (block 73329051) |
| Explorer | https://explorer.testnet.arc.io/address/0xdb1b657b487c81f68c3613fe4462c121f4ddc3c3 |

Verification: the source is verified on the Arc testnet explorer (compiler 0.8.28), and the deployed runtime bytecode matched the compiled artifact byte for byte. The frontend ABI was checked against the compiled artifact (9 entries, 0 mismatches, event signature matches).

The contract has no owner, admin, pause, upgrade path, fees or payments. It was deployed from the platform's shared testnet deployer wallet, which holds no special rights over the contract.

## What was tested

| Area | Result |
|---|---|
| Unit, fuzz and invariant tests (forge) | 96 passed, 0 failed |
| Two independent security reviews, final round | No material findings (one character-limit issue and one UTF-8 issue were found and fixed in earlier rounds) |
| Static analysis | No Medium or High findings left |
| Integration tests on a fork of Arc Testnet | 36 passed, 0 failed (posts, events, limits, malformed UTF-8, paging, ETH rejection) |
| Live write on Arc Testnet | One message posted from a throwaway test wallet funded by the testnet faucet: transaction succeeded, `messageCount` went 0 to 1, `getMessages` returned the message, and the event lookup the UI uses returned the same transaction hash. Gas cost about 0.0046 test USDC |
| Frontend ABI against the live contract | Reads and simulated writes (valid, blank and 281-character messages) behaved as expected |
| Console and app errors | No errors after the final edits. Earlier hot-reload errors were from files being edited mid-change |
| Lint and typecheck | Pass |

The first live message is "Hello from Arc Builder Playground: first live testnet message." and it will show in the app.

## Known limitations and unfinished work

- **Browser wallet flow not exercised end to end by me.** I cannot operate a browser wallet extension here. Connect, switch network, sign and confirm in the UI should be tried once by you with your own wallet and test USDC. The same contract call was tested with a script instead.
- **Messages are public, permanent and unmoderated.** Anyone can post; spam is limited only by gas cost. A direct USDC token transfer to the contract cannot be blocked and would be stuck there.
- **Blank check is ASCII-only.** Messages made only of other whitespace-like characters (for example a non-breaking space) count as content.
- **Uniswap tab is a research demo.** Only one thin pool exists for USDC and cirBTC on Arc Testnet (0.30% tier). 1 USDC shows about 3.8% price impact and 25 USDC about 68%. Real Uniswap swapping is not built: Uniswap's current Universal Router is not deployed on Arc Testnet.
- **Testnet swap liquidity is thin.** A 25 USDC quote returned no route; very small amounts work. Routing and prices come from Circle's swap service and are not market prices.
- **Only browser-extension wallets.** WalletConnect is not configured.
- **Hooked Uniswap pools** are not discovered; only the four standard hookless tiers are checked.
- **Review is not a third-party audit.** Get an independent audit before any mainnet use.
