# Guestbook contract: functions, review and test results

Source: `contracts/Guestbook.sol`. Tests: `contracts/test/Guestbook*.t.sol`. Target: Arc Testnet only. **Not deployed.**

## What it is

An immutable, append-only public guestbook. Anyone can publish a short message from their wallet, and anyone can read all messages. There is no owner, no admin, no pause, no upgrade path, no payments and no token transfers. It has no constructor arguments, no `receive` or `fallback` function, and no payable function, so it rejects plain USDC sends.

## How the important functions work

| Function | What it does |
| --- | --- |
| `addMessage(string text) returns (uint256 id)` | Publishes a message. Checks run in this order: at most 1,120 bytes; the text is well-formed UTF-8; it contains at least one character that is not a space, tab, newline or carriage return; and it has at most 280 characters (Unicode code points). It then stores `{author: msg.sender, timestamp: block.timestamp, text}`, emits `MessageAdded`, and returns the zero-based id. |
| `messageCount()` | Returns how many messages exist. |
| `getMessage(uint256 id)` | Returns one message, or reverts `MessageNotFound(id)`. |
| `getMessages(uint256 offset, uint256 limit)` | Returns up to `limit` messages starting at `offset`, oldest first. Returns an empty list when `offset` is past the end or `limit` is 0. Reverts `PageSizeTooLarge` when `limit` is above 50, so one call can never return the whole history. |

Event: `MessageAdded(uint256 indexed id, address indexed author, uint64 timestamp, string text)`.

Errors: `EmptyMessage`, `MessageTooLong(length, max)`, `MessageTooManyBytes(length, max)`, `InvalidUTF8`, `MessageNotFound(id)`, `PageSizeTooLarge(limit, max)`.

### Design choices worth knowing

- **280 characters means Unicode code points.** A first version counted bytes, which would reject an emoji-heavy message that is under 280 characters. The contract now validates strict UTF-8 and counts code points. The 1,120-byte ceiling (280 x 4) keeps storage and gas bounded.
- **Blank means ASCII whitespace only.** Space, tab, newline and carriage return alone are rejected. Other whitespace-like characters (for example a non-breaking space) count as content.
- **Messages are permanent and public.** They cannot be edited or deleted. There is no moderation, so anyone can post anything, and spam is limited only by gas cost.
- **Timestamps are the block time**, as reported by the chain.
- **Gas is mostly storage.** Measured in tests: 1 ASCII character about 103k gas, 280 ASCII characters about 516k, 280 four-byte characters about 1.36M. Deployment is about 661k gas.

## Review results (thorough level)

Round 1, security review: no material findings. Functional review: 1 High, the byte-based limit rejected valid messages under 280 characters. Fixed.
Round 2, security review: no material findings. Functional review: 1 Medium, malformed UTF-8 could slip past the character count. Fixed with strict UTF-8 validation.
Round 3, both reviews: no material findings.

Static analysis: after two small cleanups (explicit zero-initialization of three locals, and pinning the compiler to exactly 0.8.28), no Medium or High findings remain. Three notes remain and are accepted: two "timestamp comparison" Low notes that are false alarms (those functions compare array lengths, not block time), and one informational note that `addMessage` is branchy because it validates UTF-8 by hand.

This review is best effort and is not a substitute for a paid third-party audit.

## Tests

96 tests pass (unit, revert paths, paging, ETH handling, gas, 11 fuzz tests and 4 invariants):
success paths and events; every custom error with exact values; 280 and 281 character boundaries for 1-, 2-, 3- and 4-byte characters; malformed UTF-8 (stray, truncated, overlong, surrogates, above U+10FFFF, invalid lead bytes); paging edge cases; rejection of ETH; and invariants that the count only grows by one per successful add and earlier messages never change.

Run them with `bun run contracts:test`.

## Remaining before deployment

1. Your go-ahead to deploy to Arc Testnet (no mainnet, no private keys needed).
2. After deploy, set `VITE_GUESTBOOK_ADDRESS` and turn on `GUESTBOOK_WRITES_ENABLED` in `src/lib/env.ts`.
