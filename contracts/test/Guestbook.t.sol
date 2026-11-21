// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GuestbookTestBase} from "./Guestbook.Base.t.sol";
import {Guestbook} from "../Guestbook.sol";
import {Vm} from "forge-std/Vm.sol";

/// Happy path, event, boundary success cases, getMessage.
contract GuestbookTest is GuestbookTestBase {
    // ---------------------------------------------------------------- deploy
    function test_InitialStateIsEmpty() public view {
        assertEq(gb.messageCount(), 0);
        assertEq(gb.MAX_MESSAGE_LENGTH(), 280);
        assertEq(gb.MAX_MESSAGE_BYTES(), 1120);
        assertEq(gb.MAX_PAGE_SIZE(), 50);
    }

    // ------------------------------------------------------------ happy path
    function test_AddMessage_ReturnsIncrementingIds() public {
        assertEq(addAs(alice, "first"), 0);
        assertEq(addAs(alice, "second"), 1);
        assertEq(addAs(bob, "third"), 2);
        assertEq(gb.messageCount(), 3);
    }

    function test_AddMessage_StoresAuthorTimestampText() public {
        vm.warp(1_700_000_000);
        uint256 id = addAs(alice, "hello arc");
        Guestbook.Message memory m = gb.getMessage(id);
        assertEq(m.author, alice);
        assertEq(uint256(m.timestamp), 1_700_000_000);
        assertEq(m.text, "hello arc");
    }

    function test_AddMessage_MultipleAuthorsStoredSeparately() public {
        addAs(alice, "from alice");
        addAs(bob, "from bob");
        addAs(alice, "alice again");
        assertEq(gb.getMessage(0).author, alice);
        assertEq(gb.getMessage(1).author, bob);
        assertEq(gb.getMessage(2).author, alice);
        assertEq(gb.getMessage(1).text, "from bob");
        assertEq(gb.messageCount(), 3);
    }

    function test_AddMessage_TimestampsFollowWarp() public {
        vm.warp(1000);
        addAs(alice, "a");
        vm.warp(2500);
        addAs(bob, "b");
        skip(10);
        addAs(alice, "c");
        assertEq(uint256(gb.getMessage(0).timestamp), 1000);
        assertEq(uint256(gb.getMessage(1).timestamp), 2500);
        assertEq(uint256(gb.getMessage(2).timestamp), 2510);
    }

    function test_AddMessage_SameBlockSameTimestamp() public {
        vm.warp(777);
        addAs(alice, "a");
        addAs(bob, "b");
        assertEq(uint256(gb.getMessage(0).timestamp), uint256(gb.getMessage(1).timestamp));
    }

    function test_AddMessage_CountMatchesAfterEach() public {
        for (uint256 i = 0; i < 5; ++i) {
            assertEq(gb.messageCount(), i);
            addAs(alice, "x");
        }
        assertEq(gb.messageCount(), 5);
    }

    function test_AddMessage_DoesNotModifyEarlierMessages() public {
        vm.warp(100);
        addAs(alice, "one");
        vm.warp(200);
        addAs(bob, "two");
        Guestbook.Message memory m = gb.getMessage(0);
        assertEq(m.author, alice);
        assertEq(uint256(m.timestamp), 100);
        assertEq(m.text, "one");
    }

    // ----------------------------------------------------------------- event
    function test_AddMessage_EmitsMessageAdded() public {
        vm.warp(1_234_567);
        vm.expectEmit(true, true, false, true, address(gb));
        emit Guestbook.MessageAdded(0, alice, 1_234_567, "gm");
        addAs(alice, "gm");
    }

    function test_AddMessage_EventIdIsIndexAndAuthorIsSender() public {
        addAs(alice, "a");
        vm.warp(42);
        vm.expectEmit(true, true, false, true, address(gb));
        emit Guestbook.MessageAdded(1, bob, 42, unicode"héllo 😀");
        addAs(bob, unicode"héllo 😀");
    }

    function test_AddMessage_EventTopicsAreIdAndAuthor() public {
        vm.recordLogs();
        vm.warp(9);
        addAs(alice, "log me");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 1);
        assertEq(logs[0].emitter, address(gb));
        assertEq(logs[0].topics.length, 3);
        assertEq(logs[0].topics[0], Guestbook.MessageAdded.selector);
        assertEq(uint256(logs[0].topics[1]), 0);
        assertEq(address(uint160(uint256(logs[0].topics[2]))), alice);
        (uint64 ts, string memory text) = abi.decode(logs[0].data, (uint64, string));
        assertEq(uint256(ts), 9);
        assertEq(text, "log me");
    }

    // ------------------------------------------------------ boundary success
    function test_Boundary_Exactly280Ascii() public {
        string memory t = asciiRep("a", 280);
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_Exactly1Ascii() public {
        uint256 id = addAs(alice, "a");
        assertEq(gb.getMessage(id).text, "a");
    }

    function test_Boundary_280TwoByteCodePoints() public {
        string memory t = rep(TWO_BYTE, 280);
        assertEq(bytes(t).length, 560);
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_280ThreeByteCodePoints() public {
        string memory t = rep(THREE_BYTE, 280);
        assertEq(bytes(t).length, 840);
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_280FourByteCodePoints_Is1120Bytes() public {
        string memory t = rep(FOUR_BYTE, 280);
        assertEq(bytes(t).length, 1120);
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_MixedWidthsExactly280() public {
        // 70 of each width + 70 ascii = 280 code points
        string memory t = string.concat(asciiRep("z", 70), rep(TWO_BYTE, 70), rep(THREE_BYTE, 70), rep(FOUR_BYTE, 70));
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_LeadingTrailingWhitespaceWithContent() public {
        string memory t = " \t\n\r hi \r\n\t ";
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_WhitespaceCountsTowardLength() public {
        // 279 spaces + 'x' = 280 -> ok
        string memory t = string.concat(asciiRep(" ", 279), "x");
        addAs(alice, t);
        assertEq(gb.messageCount(), 1);
    }

    function test_Boundary_SingleNonWhitespaceAmongWhitespace() public {
        addAs(alice, "   \t\t\n\n\r\r.   ");
        assertEq(gb.messageCount(), 1);
    }

    function test_Boundary_ValidMultibyteEmoji() public {
        string memory t = unicode"gm 😀🚀 café ✓ 日本語";
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    function test_Boundary_UnicodeEdgeCodePointsAccepted() public {
        // U+0080, U+07FF, U+0800, U+D7FF, U+E000, U+FFFF, U+10000, U+10FFFF
        bytes memory raw = hex"C280" hex"DFBF" hex"E0A080" hex"ED9FBF" hex"EE8080" hex"EFBFBF" hex"F0908080" hex"F48FBFBF";
        uint256 id = addAs(alice, string(raw));
        assertEq(bytes(gb.getMessage(id).text), raw);
    }

    function test_Boundary_NonAsciiWhitespaceLookalikesCountAsContent() public {
        // U+00A0 (NBSP) is not ASCII whitespace -> accepted as content
        addAs(alice, string(hex"C2A0"));
        assertEq(gb.messageCount(), 1);
    }

    // ------------------------------------------------------------ getMessage
    function test_GetMessage_OutOfRangeRevertsOnEmpty() public {
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageNotFound.selector, 0));
        gb.getMessage(0);
    }

    function test_GetMessage_OutOfRangeReverts() public {
        addAs(alice, "a");
        addAs(alice, "b");
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageNotFound.selector, 2));
        gb.getMessage(2);
    }

    function test_GetMessage_HugeIdReverts() public {
        addAs(alice, "a");
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageNotFound.selector, type(uint256).max));
        gb.getMessage(type(uint256).max);
    }

    function test_GetMessage_LastValidIndexWorks() public {
        addAs(alice, "a");
        addAs(bob, "b");
        assertEq(gb.getMessage(1).text, "b");
    }
}
