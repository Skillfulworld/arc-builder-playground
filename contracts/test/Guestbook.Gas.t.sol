// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {console2} from "forge-std/Test.sol";
import {GuestbookTestBase} from "./Guestbook.Base.t.sol";

/// Informational gas measurements for addMessage (cold storage, fresh deployment).
contract GuestbookGasTest is GuestbookTestBase {
    function _measure(string memory label, string memory text) internal {
        uint256 g = gasleft();
        vm.prank(alice);
        gb.addMessage(text);
        uint256 used = g - gasleft();
        console2.log(label, used);
        assertEq(gb.messageCount(), 1);
    }

    function test_Gas_AddMessage_1Char() public {
        _measure("gas addMessage 1 ascii char:", "a");
    }

    function test_Gas_AddMessage_280Ascii() public {
        _measure("gas addMessage 280 ascii chars:", asciiRep("a", 280));
    }

    function test_Gas_AddMessage_280FourByte() public {
        _measure("gas addMessage 280 four-byte chars (1120 bytes):", rep(FOUR_BYTE, 280));
    }
}
