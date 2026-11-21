// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GuestbookTestBase} from "./Guestbook.Base.t.sol";
import {Guestbook} from "../Guestbook.sol";

contract GuestbookFuzzTest is GuestbookTestBase {
    /// @dev Build `len` ASCII bytes (0x00..0x7F) from seed, with one guaranteed non-whitespace char.
    function _ascii(uint256 len, bytes32 seed, uint256 pos) internal pure returns (bytes memory out) {
        out = new bytes(len);
        for (uint256 i = 0; i < len; ++i) {
            // bias toward whitespace to exercise the blank-detection path
            uint8 b = uint8(uint256(keccak256(abi.encode(seed, i))));
            out[i] = (b % 3 == 0) ? bytes1(uint8(0x20)) : bytes1(b % 128);
        }
        out[pos % len] = "A";
    }

    function testFuzz_ValidAsciiAccepted(uint256 len, bytes32 seed, uint256 pos, address who) public {
        len = bound(len, 1, 280);
        vm.assume(who != address(0));
        bytes memory raw = _ascii(len, seed, pos);
        vm.prank(who);
        uint256 id = gb.addMessage(string(raw));
        assertEq(id, 0);
        assertEq(gb.messageCount(), 1);
        Guestbook.Message memory m = gb.getMessage(0);
        assertEq(m.author, who);
        assertEq(bytes(m.text), raw);
        assertEq(uint256(m.timestamp), block.timestamp);
    }

    function testFuzz_AsciiOver280Rejected(uint256 len, bytes32 seed, uint256 pos) public {
        len = bound(len, 281, 1120);
        bytes memory raw = _ascii(len, seed, pos);
        string memory t = string(raw);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, len, 280));
        gb.addMessage(t);
        assertEq(gb.messageCount(), 0);
    }

    function testFuzz_AsciiOver1120BytesRejected(uint256 len, bytes32 seed, uint256 pos) public {
        len = bound(len, 1121, 4000);
        bytes memory raw = _ascii(len, seed, pos);
        string memory t = string(raw);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, len, 1120));
        gb.addMessage(t);
        assertEq(gb.messageCount(), 0);
    }

    function testFuzz_WhitespaceOnlyRejected(uint256 len, bytes32 seed) public {
        len = bound(len, 1, 1120);
        bytes memory raw = new bytes(len);
        bytes memory ws = hex"20090a0d";
        for (uint256 i = 0; i < len; ++i) {
            raw[i] = ws[uint8(uint256(keccak256(abi.encode(seed, i)))) % 4];
        }
        string memory t = string(raw);
        vm.expectRevert(Guestbook.EmptyMessage.selector);
        gb.addMessage(t);
    }

    function testFuzz_FourByteCodePointsUpTo280Accepted(uint256 n) public {
        n = bound(n, 1, 280);
        string memory t = rep(FOUR_BYTE, n);
        uint256 id = addAs(alice, t);
        assertEq(gb.getMessage(id).text, t);
    }

    /// @dev Arbitrary bytes either revert with a known error and leave state intact,
    ///      or succeed, incrementing the count by exactly one and storing the bytes verbatim.
    function testFuzz_ArbitraryBytesNeverCorruptState(bytes calldata raw) public {
        addAs(alice, "seed message");
        uint256 before = gb.messageCount();
        Guestbook.Message memory first = gb.getMessage(0);

        (bool ok, bytes memory ret) = address(gb).call(abi.encodeCall(gb.addMessage, (string(raw))));

        if (ok) {
            assertEq(gb.messageCount(), before + 1);
            assertEq(abi.decode(ret, (uint256)), before);
            assertEq(bytes(gb.getMessage(before).text), raw);
            assertGe(raw.length, 1);
            assertLe(raw.length, 1120);
        } else {
            assertEq(gb.messageCount(), before);
            bytes4 sel = bytes4(ret);
            assertTrue(
                sel == Guestbook.EmptyMessage.selector || sel == Guestbook.MessageTooLong.selector
                    || sel == Guestbook.MessageTooManyBytes.selector || sel == Guestbook.InvalidUTF8.selector,
                "unexpected revert selector"
            );
        }
        Guestbook.Message memory firstAfter = gb.getMessage(0);
        assertEq(firstAfter.author, first.author);
        assertEq(firstAfter.text, first.text);
        assertEq(uint256(firstAfter.timestamp), uint256(first.timestamp));
    }

    /// @dev Pure ASCII subset of arbitrary bytes: reference model must agree with the contract.
    function testFuzz_AsciiBytesMatchReferenceModel(bytes calldata raw) public {
        bool allAscii = true;
        bool content = false;
        for (uint256 i = 0; i < raw.length; ++i) {
            uint8 b = uint8(raw[i]);
            if (b > 0x7F) allAscii = false;
            if (b != 0x20 && b != 0x09 && b != 0x0a && b != 0x0d) content = true;
        }
        vm.assume(allAscii);
        (bool ok,) = address(gb).call(abi.encodeCall(gb.addMessage, (string(raw))));
        bool expected = raw.length >= 1 && raw.length <= 280 && content;
        assertEq(ok, expected);
    }

    function testFuzz_PagingConsistentWithGetMessage(uint8 n, uint256 offset, uint256 limit) public {
        n = uint8(bound(n, 0, 120));
        limit = bound(limit, 0, 50);
        offset = bound(offset, 0, 200);
        populate(n);
        Guestbook.Message[] memory page = gb.getMessages(offset, limit);
        uint256 expectedLen = offset >= n ? 0 : (n - offset < limit ? n - offset : limit);
        assertEq(page.length, expectedLen);
        for (uint256 i = 0; i < page.length; ++i) {
            assertEq(page[i].text, gb.getMessage(offset + i).text);
        }
    }

    function testFuzz_PageLimitOver50Reverts(uint256 limit, uint256 offset) public {
        limit = bound(limit, 51, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.PageSizeTooLarge.selector, limit, 50));
        gb.getMessages(offset, limit);
    }

    function testFuzz_GetMessageOutOfRangeReverts(uint256 id) public {
        populate(3);
        id = bound(id, 3, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageNotFound.selector, id));
        gb.getMessage(id);
    }

    function testFuzz_TimestampRecorded(uint64 ts) public {
        ts = uint64(bound(ts, 1, type(uint64).max));
        vm.warp(ts);
        uint256 id = addAs(alice, "t");
        assertEq(uint256(gb.getMessage(id).timestamp), uint256(ts));
    }
}
