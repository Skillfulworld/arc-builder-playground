// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Guestbook
/// @notice An immutable, append-only public guestbook for Arc Testnet.
/// @dev This is an educational contract. Messages are public and cannot be edited or deleted.
///      Characters are Unicode code points, limited to 280 with a 1120-byte ceiling.
///      Invalid UTF-8 is rejected with InvalidUTF8.
contract Guestbook {
    /// @notice Maximum message length in characters (Unicode code points).
    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    /// @notice Maximum message length in bytes, bounding storage and scanning costs.
    uint256 public constant MAX_MESSAGE_BYTES = 1120;

    /// @notice Maximum number of messages requested in one page.
    uint256 public constant MAX_PAGE_SIZE = 50;

    struct Message {
        address author;
        uint64 timestamp;
        string text;
    }

    Message[] private messages;

    /// @notice The message is empty, has zero code points, or contains only ASCII whitespace.
    error EmptyMessage();

    /// @notice The message exceeds the maximum character (Unicode code point) count.
    error MessageTooLong(uint256 length, uint256 max);

    /// @notice The message exceeds the maximum byte length.
    error MessageTooManyBytes(uint256 length, uint256 max);

    /// @notice The message contains invalid UTF-8.
    error InvalidUTF8();

    /// @notice No message exists at the requested index.
    error MessageNotFound(uint256 id);

    /// @notice The requested page limit exceeds the maximum page size.
    error PageSizeTooLarge(uint256 limit, uint256 max);

    /// @notice Emitted whenever a message is appended.
    event MessageAdded(uint256 indexed id, address indexed author, uint64 timestamp, string text);

    /// @notice Publish a permanent public message from your wallet.
    /// @dev Enforces MAX_MESSAGE_BYTES (1120) before one bounded pass validates strict UTF-8,
    ///      counts each accepted sequence as one Unicode code point, and checks for blank
    ///      messages, with a maximum of MAX_MESSAGE_LENGTH (280) code points.
    ///      Only space, tab, newline, and carriage return count as ASCII whitespace.
    ///      Empty messages, ASCII-whitespace-only messages, and zero code points are rejected.
    ///      Invalid UTF-8 is rejected with InvalidUTF8.
    /// @param text The public message, with at least one code point and non-whitespace byte.
    /// @return id The zero-based index assigned to the new message.
    function addMessage(string calldata text) external returns (uint256 id) {
        bytes calldata content = bytes(text);
        uint256 length = content.length;
        if (length > MAX_MESSAGE_BYTES) {
            revert MessageTooManyBytes(length, MAX_MESSAGE_BYTES);
        }
        if (length == 0) revert EmptyMessage();

        uint256 codePointCount = 0;
        bool hasContent = false;
        for (uint256 i = 0; i < length;) {
            bytes1 character = content[i];
            uint8 lead = uint8(character);
            uint256 sequenceLength = 0;
            uint8 secondMin = 0x80;
            uint8 secondMax = 0xBF;

            if (lead <= 0x7F) {
                sequenceLength = 1;
            } else if (lead >= 0xC2 && lead <= 0xDF) {
                sequenceLength = 2;
            } else if (lead >= 0xE0 && lead <= 0xEF) {
                sequenceLength = 3;
                if (lead == 0xE0) secondMin = 0xA0;
                if (lead == 0xED) secondMax = 0x9F;
            } else if (lead >= 0xF0 && lead <= 0xF4) {
                sequenceLength = 4;
                if (lead == 0xF0) secondMin = 0x90;
                if (lead == 0xF4) secondMax = 0x8F;
            } else {
                revert InvalidUTF8();
            }

            if (sequenceLength > length - i) revert InvalidUTF8();
            if (sequenceLength >= 2) {
                uint8 second = uint8(content[i + 1]);
                if (second < secondMin || second > secondMax) revert InvalidUTF8();
            }
            if (sequenceLength >= 3) {
                uint8 third = uint8(content[i + 2]);
                if (third < 0x80 || third > 0xBF) revert InvalidUTF8();
            }
            if (sequenceLength == 4) {
                uint8 fourth = uint8(content[i + 3]);
                if (fourth < 0x80 || fourth > 0xBF) revert InvalidUTF8();
            }

            ++codePointCount;
            if (
                character != 0x20 && character != 0x09
                    && character != 0x0a && character != 0x0d
            ) {
                hasContent = true;
            }
            i += sequenceLength;
        }
        if (!hasContent || codePointCount == 0) revert EmptyMessage();
        if (codePointCount > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong(codePointCount, MAX_MESSAGE_LENGTH);
        }

        id = messages.length;
        uint64 timestamp = uint64(block.timestamp);
        messages.push(Message({author: msg.sender, timestamp: timestamp, text: text}));
        emit MessageAdded(id, msg.sender, timestamp, text);
    }

    /// @notice Read the total number of published messages.
    /// @return count The number of messages stored.
    function messageCount() external view returns (uint256 count) {
        return messages.length;
    }

    /// @notice Read a message by its zero-based index.
    /// @dev Reverts with MessageNotFound when the index is out of range.
    /// @param id The index of the message to read.
    /// @return message The stored author, timestamp, and text.
    function getMessage(uint256 id) external view returns (Message memory message) {
        if (id >= messages.length) revert MessageNotFound(id);
        return messages[id];
    }

    /// @notice Read a bounded page of messages in ascending index order, oldest first.
    /// @dev Limits above MAX_PAGE_SIZE always revert, even when offset is out of range.
    ///      Otherwise returns an empty array for an out-of-range offset or zero limit,
    ///      and returns fewer than limit messages when fewer remain.
    /// @param offset The zero-based index at which to begin reading.
    /// @param limit The maximum number of messages to return, at most MAX_PAGE_SIZE.
    /// @return page The requested messages in ascending index order.
    function getMessages(uint256 offset, uint256 limit) external view returns (Message[] memory page) {
        if (limit > MAX_PAGE_SIZE) revert PageSizeTooLarge(limit, MAX_PAGE_SIZE);

        uint256 count = messages.length;
        if (offset >= count || limit == 0) return new Message[](0);

        uint256 size = count - offset;
        if (size > limit) size = limit;
        page = new Message[](size);
        for (uint256 i = 0; i < size; ++i) {
            page[i] = messages[offset + i];
        }
    }
}
