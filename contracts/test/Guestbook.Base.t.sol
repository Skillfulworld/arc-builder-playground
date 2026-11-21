// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Guestbook} from "../Guestbook.sol";

abstract contract GuestbookTestBase is Test {
    Guestbook internal gb;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant MAX_LEN = 280;
    uint256 internal constant MAX_BYTES = 1120;
    uint256 internal constant MAX_PAGE = 50;

    // Reusable UTF-8 code points
    bytes internal constant TWO_BYTE = hex"C3A9"; // U+00E9 e-acute
    bytes internal constant THREE_BYTE = hex"E282AC"; // U+20AC euro
    bytes internal constant FOUR_BYTE = hex"F09F9880"; // U+1F600 grinning face

    function setUp() public virtual {
        gb = new Guestbook();
    }

    /// @dev Repeat `unit` `n` times into a string.
    function rep(bytes memory unit, uint256 n) internal pure returns (string memory) {
        bytes memory out = new bytes(unit.length * n);
        for (uint256 i = 0; i < n; ++i) {
            for (uint256 j = 0; j < unit.length; ++j) {
                out[i * unit.length + j] = unit[j];
            }
        }
        return string(out);
    }

    function asciiRep(bytes1 c, uint256 n) internal pure returns (string memory) {
        return rep(abi.encodePacked(c), n);
    }

    /// @dev Add as `who`, return id.
    function addAs(address who, string memory text) internal returns (uint256 id) {
        vm.prank(who);
        id = gb.addMessage(text);
    }

    /// @dev Expect the next addMessage(raw bytes) to revert with a no-arg custom error.
    function expectAddRevert(bytes memory raw, bytes4 sel) internal {
        vm.expectRevert(sel);
        gb.addMessage(string(raw));
    }

    function expectInvalidUtf8(bytes memory raw) internal {
        expectAddRevert(raw, Guestbook.InvalidUTF8.selector);
    }

    /// @dev Populate n messages with text = decimal index.
    function populate(uint256 n) internal {
        for (uint256 i = 0; i < n; ++i) {
            addAs(i % 2 == 0 ? alice : bob, vm.toString(i));
        }
    }
}
