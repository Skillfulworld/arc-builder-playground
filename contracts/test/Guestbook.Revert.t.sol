// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GuestbookTestBase} from "./Guestbook.Base.t.sol";
import {Guestbook} from "../Guestbook.sol";

/// addMessage revert paths with exact custom errors. No state may change on revert.
contract GuestbookRevertTest is GuestbookTestBase {
    // ------------------------------------------------------------ EmptyMessage
    function test_Revert_EmptyString() public {
        expectAddRevert("", Guestbook.EmptyMessage.selector);
        assertEq(gb.messageCount(), 0);
    }

    function test_Revert_OnlySpace() public {
        expectAddRevert(" ", Guestbook.EmptyMessage.selector);
    }

    function test_Revert_OnlyTab() public {
        expectAddRevert("\t", Guestbook.EmptyMessage.selector);
    }

    function test_Revert_OnlyNewline() public {
        expectAddRevert("\n", Guestbook.EmptyMessage.selector);
    }

    function test_Revert_OnlyCarriageReturn() public {
        expectAddRevert("\r", Guestbook.EmptyMessage.selector);
    }

    function test_Revert_MixedWhitespaceOnly() public {
        expectAddRevert(" \t\n\r  \r\n\t ", Guestbook.EmptyMessage.selector);
        assertEq(gb.messageCount(), 0);
    }

    function test_Revert_WhitespaceOnly280() public {
        expectAddRevert(bytes(asciiRep(" ", 280)), Guestbook.EmptyMessage.selector);
    }

    function test_Revert_WhitespaceOnly281_IsEmptyNotTooLong() public {
        expectAddRevert(bytes(asciiRep(" ", 281)), Guestbook.EmptyMessage.selector);
    }

    // --------------------------------------------------------- MessageTooLong
    function test_Revert_TooLong281Ascii() public {
        string memory t = asciiRep("a", 281);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, 281, 280));
        gb.addMessage(t);
        assertEq(gb.messageCount(), 0);
    }

    function test_Revert_TooLong281TwoByte() public {
        string memory t = rep(TWO_BYTE, 281);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, 281, 280));
        gb.addMessage(t);
    }

    function test_Revert_TooLong281ThreeByte() public {
        string memory t = rep(THREE_BYTE, 281);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, 281, 280));
        gb.addMessage(t);
    }

    function test_Revert_TooLong1120AsciiBytes() public {
        string memory t = asciiRep("a", 1120);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, 1120, 280));
        gb.addMessage(t);
    }

    function test_Revert_TooLong280PlusWhitespace() public {
        // whitespace counts as characters
        string memory t = string.concat(asciiRep("a", 280), " ");
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooLong.selector, 281, 280));
        gb.addMessage(t);
    }

    // ------------------------------------------------------ MessageTooManyBytes
    function test_Revert_TooManyBytes1121Ascii() public {
        string memory t = asciiRep("a", 1121);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, 1121, 1120));
        gb.addMessage(t);
        assertEq(gb.messageCount(), 0);
    }

    function test_Revert_TooManyBytes281FourByte() public {
        // 281 * 4 = 1124 bytes
        string memory t = rep(FOUR_BYTE, 281);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, 1124, 1120));
        gb.addMessage(t);
    }

    function test_Revert_TooManyBytes1121Exactly_280FourBytePlusOneAscii() public {
        string memory t = string.concat(rep(FOUR_BYTE, 280), "a");
        assertEq(bytes(t).length, 1121);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, 1121, 1120));
        gb.addMessage(t);
    }

    function test_Revert_TooManyBytesWhitespaceOnly() public {
        // byte ceiling is checked before blank detection
        string memory t = asciiRep(" ", 1121);
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, 1121, 1120));
        gb.addMessage(t);
    }

    function test_Revert_TooManyBytesTakesPrecedenceOverInvalidUtf8() public {
        bytes memory raw = bytes(asciiRep("a", 1120));
        raw = bytes.concat(raw, hex"FF");
        vm.expectRevert(abi.encodeWithSelector(Guestbook.MessageTooManyBytes.selector, 1121, 1120));
        gb.addMessage(string(raw));
    }

    // ------------------------------------------------------------ InvalidUTF8
    function test_Revert_StrayContinuationByte() public {
        expectInvalidUtf8(hex"80");
        expectInvalidUtf8(hex"BF");
        expectInvalidUtf8(hex"6180");
        expectInvalidUtf8(hex"61BF62");
    }

    function test_Revert_TruncatedSequences() public {
        expectInvalidUtf8(hex"C3"); // 2-byte, missing continuation
        expectInvalidUtf8(hex"E282"); // 3-byte, missing last
        expectInvalidUtf8(hex"E2"); // 3-byte, only lead
        expectInvalidUtf8(hex"F09F98"); // 4-byte, missing last
        expectInvalidUtf8(hex"F09F"); // 4-byte, only two
        expectInvalidUtf8(hex"F0"); // 4-byte, only lead
        expectInvalidUtf8(hex"61F09F98"); // after valid content
    }

    function test_Revert_BadContinuationInsideSequence() public {
        expectInvalidUtf8(hex"C341"); // second byte ASCII
        expectInvalidUtf8(hex"E24182"); // second byte bad
        expectInvalidUtf8(hex"E28241"); // third byte bad
        expectInvalidUtf8(hex"F0414141"); // second byte bad
        expectInvalidUtf8(hex"F09F4180"); // third byte bad
        expectInvalidUtf8(hex"F09F9841"); // fourth byte bad
        expectInvalidUtf8(hex"C3C3"); // lead as continuation
    }

    function test_Revert_OverlongEncodings() public {
        expectInvalidUtf8(hex"C080"); // overlong NUL
        expectInvalidUtf8(hex"C1BF"); // overlong U+007F
        expectInvalidUtf8(hex"E08080"); // overlong 3-byte
        expectInvalidUtf8(hex"E09FBF"); // overlong U+07FF
        expectInvalidUtf8(hex"F0808080"); // overlong 4-byte
        expectInvalidUtf8(hex"F08FBFBF"); // overlong U+FFFF
    }

    function test_Revert_SurrogateCodePoints() public {
        expectInvalidUtf8(hex"EDA080"); // U+D800
        expectInvalidUtf8(hex"EDAFBF"); // U+DBFF
        expectInvalidUtf8(hex"EDBFBF"); // U+DFFF
    }

    function test_Revert_AboveMaxCodePoint() public {
        expectInvalidUtf8(hex"F4908080"); // U+110000
        expectInvalidUtf8(hex"F4BFBFBF");
        expectInvalidUtf8(hex"F5808080");
    }

    function test_Revert_InvalidLeadBytes() public {
        expectInvalidUtf8(hex"C0");
        expectInvalidUtf8(hex"C1");
        expectInvalidUtf8(hex"F5");
        expectInvalidUtf8(hex"FF");
        expectInvalidUtf8(hex"FE");
        expectInvalidUtf8(hex"F8");
        expectInvalidUtf8(hex"FC");
    }

    function test_Revert_AllInvalidLeadBytes_0xF5_to_0xFF_and_C0_C1() public {
        for (uint256 b = 0xF5; b <= 0xFF; ++b) {
            expectInvalidUtf8(abi.encodePacked(bytes1(uint8(b)), hex"80808080"));
        }
        expectInvalidUtf8(hex"C0BF");
        expectInvalidUtf8(hex"C180");
    }

    function test_Revert_InvalidUtf8AfterValidContent() public {
        expectInvalidUtf8(bytes.concat(bytes("hello "), hex"FF"));
    }

    function test_Revert_InvalidUtf8EvenWhenOtherwiseWhitespace() public {
        expectInvalidUtf8(bytes.concat(bytes("  \t"), hex"80"));
    }

    function test_Revert_InvalidUtf8TakesPrecedenceOverTooLong() public {
        // 281 ASCII chars + stray byte -> UTF-8 validation happens in the loop, before the length check
        bytes memory raw = bytes.concat(bytes(asciiRep("a", 281)), hex"80");
        expectInvalidUtf8(raw);
    }

    function test_Revert_NoStateChangeOnRevert() public {
        addAs(alice, "ok");
        expectInvalidUtf8(hex"FF");
        expectAddRevert("", Guestbook.EmptyMessage.selector);
        assertEq(gb.messageCount(), 1);
        assertEq(gb.getMessage(0).text, "ok");
    }
}
