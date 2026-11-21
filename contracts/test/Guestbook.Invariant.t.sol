// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GuestbookTestBase} from "./Guestbook.Base.t.sol";
import {Guestbook} from "../Guestbook.sol";

/// Drives addMessage with bounded valid-ish and raw inputs; records ghost history.
contract GuestbookHandler is Test {
    Guestbook public gb;

    struct Rec {
        address author;
        uint64 timestamp;
        bytes text;
    }

    Rec[] internal history;
    uint256 public successes;
    uint256 public failures;
    uint256 public lastCountBefore;
    uint256 public lastCountAfter;
    bool public countJumpViolation;

    address[3] internal actors;

    constructor(Guestbook _gb) {
        gb = _gb;
        actors[0] = makeAddr("actor0");
        actors[1] = makeAddr("actor1");
        actors[2] = makeAddr("actor2");
    }

    function historyLength() external view returns (uint256) {
        return history.length;
    }

    function historyAt(uint256 i) external view returns (Rec memory) {
        return history[i];
    }

    function _try(uint256 actorSeed, uint256 warpBy, bytes memory raw) internal {
        address who = actors[actorSeed % 3];
        warpBy = bound(warpBy, 0, 1 days);
        skip(warpBy);
        uint256 beforeCount = gb.messageCount();
        vm.prank(who);
        try gb.addMessage(string(raw)) returns (uint256 id) {
            uint256 afterCount = gb.messageCount();
            if (afterCount != beforeCount + 1 || id != beforeCount) countJumpViolation = true;
            history.push(Rec(who, uint64(block.timestamp), raw));
            successes++;
        } catch {
            if (gb.messageCount() != beforeCount) countJumpViolation = true;
            failures++;
        }
    }

    /// @dev Printable ASCII message, mostly valid.
    function addAscii(uint256 actorSeed, uint256 warpBy, uint256 len, bytes32 seed) external {
        len = bound(len, 0, 300);
        bytes memory raw = new bytes(len);
        for (uint256 i = 0; i < len; ++i) {
            raw[i] = bytes1(uint8(0x20 + (uint256(keccak256(abi.encode(seed, i))) % 95)));
        }
        _try(actorSeed, warpBy, raw);
    }

    /// @dev Multibyte message of N code points of a chosen width.
    function addMultibyte(uint256 actorSeed, uint256 warpBy, uint256 n, uint256 width) external {
        n = bound(n, 1, 290);
        width = bound(width, 2, 4);
        bytes memory unit = width == 2 ? bytes(hex"C3A9") : width == 3 ? bytes(hex"E282AC") : bytes(hex"F09F9880");
        bytes memory raw = new bytes(n * width);
        for (uint256 i = 0; i < n; ++i) {
            for (uint256 j = 0; j < width; ++j) {
                raw[i * width + j] = unit[j];
            }
        }
        _try(actorSeed, warpBy, raw);
    }

    /// @dev Arbitrary bytes (mostly rejected).
    function addRaw(uint256 actorSeed, uint256 warpBy, bytes calldata raw) external {
        _try(actorSeed, warpBy, raw);
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 100
/// forge-config: default.invariant.fail-on-revert = false
contract GuestbookInvariantTest is GuestbookTestBase {
    GuestbookHandler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new GuestbookHandler(gb);
        targetContract(address(handler));
    }

    /// messageCount increases by exactly one per successful add, never on failure.
    function invariant_CountEqualsSuccessfulAdds() public view {
        assertEq(gb.messageCount(), handler.successes());
        assertEq(gb.messageCount(), handler.historyLength());
        assertFalse(handler.countJumpViolation(), "count changed by != 1 on success or != 0 on failure");
    }

    /// previous messages never change: every stored message matches what was recorded when added.
    function invariant_PreviousMessagesImmutable() public view {
        uint256 n = handler.historyLength();
        for (uint256 i = 0; i < n; ++i) {
            GuestbookHandler.Rec memory r = handler.historyAt(i);
            Guestbook.Message memory m = gb.getMessage(i);
            assertEq(m.author, r.author);
            assertEq(uint256(m.timestamp), uint256(r.timestamp));
            assertEq(bytes(m.text), r.text);
        }
    }

    /// paging returns the same data as the history, oldest first.
    function invariant_PagingMatchesHistoryOrder() public view {
        uint256 n = handler.historyLength();
        uint256 limit = n > 50 ? 50 : n;
        Guestbook.Message[] memory page = gb.getMessages(0, limit);
        assertEq(page.length, limit);
        for (uint256 i = 0; i < page.length; ++i) {
            assertEq(bytes(page[i].text), handler.historyAt(i).text);
        }
    }

    function invariant_NoEthHeld() public view {
        assertEq(address(gb).balance, 0);
    }
}
