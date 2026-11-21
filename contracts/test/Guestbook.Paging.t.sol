// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GuestbookTestBase} from "./Guestbook.Base.t.sol";
import {Guestbook} from "../Guestbook.sol";

/// getMessages paging + ETH rejection / non-payable surface.
contract GuestbookPagingTest is GuestbookTestBase {
    function _tooLarge(uint256 limit) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(Guestbook.PageSizeTooLarge.selector, limit, 50);
    }

    // ---------------------------------------------------------------- empty
    function test_Page_EmptyGuestbookReturnsEmpty() public view {
        assertEq(gb.getMessages(0, 10).length, 0);
        assertEq(gb.getMessages(0, 50).length, 0);
        assertEq(gb.getMessages(100, 10).length, 0);
    }

    function test_Page_OffsetEqualCountReturnsEmpty() public {
        populate(3);
        assertEq(gb.getMessages(3, 10).length, 0);
    }

    function test_Page_OffsetBeyondCountReturnsEmpty() public {
        populate(3);
        assertEq(gb.getMessages(4, 10).length, 0);
        assertEq(gb.getMessages(type(uint256).max, 10).length, 0);
    }

    function test_Page_LimitZeroReturnsEmpty() public {
        populate(3);
        assertEq(gb.getMessages(0, 0).length, 0);
        assertEq(gb.getMessages(1, 0).length, 0);
    }

    // ------------------------------------------------------- partial / full
    function test_Page_PartialLastPage() public {
        populate(7);
        Guestbook.Message[] memory page = gb.getMessages(5, 10);
        assertEq(page.length, 2);
        assertEq(page[0].text, "5");
        assertEq(page[1].text, "6");
    }

    function test_Page_LimitSmallerThanRemaining() public {
        populate(7);
        Guestbook.Message[] memory page = gb.getMessages(2, 3);
        assertEq(page.length, 3);
        assertEq(page[0].text, "2");
        assertEq(page[2].text, "4");
    }

    function test_Page_ExactLastPage() public {
        populate(6);
        Guestbook.Message[] memory page = gb.getMessages(3, 3);
        assertEq(page.length, 3);
        assertEq(page[2].text, "5");
    }

    function test_Page_FullPagesAcrossHistory() public {
        populate(120);
        uint256 seen;
        uint256 offset;
        while (true) {
            Guestbook.Message[] memory page = gb.getMessages(offset, 50);
            if (page.length == 0) break;
            for (uint256 i = 0; i < page.length; ++i) {
                assertEq(page[i].text, vm.toString(offset + i));
                seen++;
            }
            offset += page.length;
        }
        assertEq(seen, 120);
        assertEq(gb.getMessages(0, 50).length, 50);
        assertEq(gb.getMessages(50, 50).length, 50);
        assertEq(gb.getMessages(100, 50).length, 20);
        assertEq(gb.getMessages(120, 50).length, 0);
    }

    function test_Page_OrderIsOldestFirstAndMatchesGetMessage() public {
        vm.warp(1000);
        addAs(alice, "oldest");
        vm.warp(2000);
        addAs(bob, "middle");
        vm.warp(3000);
        addAs(alice, "newest");
        Guestbook.Message[] memory page = gb.getMessages(0, 10);
        assertEq(page.length, 3);
        assertEq(page[0].text, "oldest");
        assertEq(page[1].text, "middle");
        assertEq(page[2].text, "newest");
        assertEq(page[0].author, alice);
        assertEq(page[1].author, bob);
        assertEq(uint256(page[0].timestamp), 1000);
        assertEq(uint256(page[1].timestamp), 2000);
        assertEq(uint256(page[2].timestamp), 3000);
        for (uint256 i = 0; i < 3; ++i) {
            Guestbook.Message memory m = gb.getMessage(i);
            assertEq(page[i].text, m.text);
            assertEq(page[i].author, m.author);
            assertEq(uint256(page[i].timestamp), uint256(m.timestamp));
        }
    }

    function test_Page_Limit50IsOk() public {
        populate(60);
        assertEq(gb.getMessages(0, 50).length, 50);
        assertEq(gb.getMessages(10, 50).length, 50);
        assertEq(gb.getMessages(11, 50).length, 49);
    }

    function test_Page_Limit51Reverts() public {
        populate(60);
        vm.expectRevert(_tooLarge(51));
        gb.getMessages(0, 51);
    }

    function test_Page_Limit51RevertsOnEmptyGuestbook() public {
        vm.expectRevert(_tooLarge(51));
        gb.getMessages(0, 51);
    }

    function test_Page_Limit51RevertsEvenWhenOffsetOutOfRange() public {
        populate(3);
        vm.expectRevert(_tooLarge(51));
        gb.getMessages(1000, 51);
    }

    function test_Page_HugeLimitReverts() public {
        vm.expectRevert(_tooLarge(type(uint256).max));
        gb.getMessages(0, type(uint256).max);
    }

    function test_Page_ReturnsMultibyteTextIntact() public {
        string memory t = unicode"héllo 😀 €";
        addAs(alice, t);
        assertEq(gb.getMessages(0, 1)[0].text, t);
    }

    // ------------------------------------------------------ ETH / payability
    function test_Eth_PlainSendReverts() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        (bool ok,) = address(gb).call{value: 1 ether}("");
        assertFalse(ok);
        assertEq(address(gb).balance, 0);
        assertEq(alice.balance, 1 ether);
    }

    function test_Eth_SendWithCalldataToUnknownSelectorReverts() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        (bool ok,) = address(gb).call{value: 1}(hex"deadbeef");
        assertFalse(ok);
        assertEq(address(gb).balance, 0);
    }

    function test_Eth_EmptyCalldataNoValueReverts() public {
        (bool ok,) = address(gb).call("");
        assertFalse(ok);
    }

    function test_Eth_UnknownSelectorReverts() public {
        (bool ok,) = address(gb).call(hex"deadbeef");
        assertFalse(ok);
    }

    function test_Eth_NoFunctionIsPayable() public {
        vm.deal(alice, 10 ether);
        bytes[4] memory calls = [
            abi.encodeCall(gb.addMessage, ("hi")),
            abi.encodeCall(gb.messageCount, ()),
            abi.encodeCall(gb.getMessage, (0)),
            abi.encodeCall(gb.getMessages, (0, 1))
        ];
        for (uint256 i = 0; i < calls.length; ++i) {
            vm.prank(alice);
            (bool ok,) = address(gb).call{value: 1 wei}(calls[i]);
            assertFalse(ok, "function accepted ETH");
        }
        assertEq(address(gb).balance, 0);
        assertEq(gb.messageCount(), 0);
    }

    function test_Eth_NoBalanceAfterNormalUse() public {
        populate(5);
        assertEq(address(gb).balance, 0);
    }
}
