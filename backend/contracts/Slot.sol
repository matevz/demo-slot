// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract Slot {
    event Win(address player);
    event Lose(address player);

    error Forbidden();
    error InvalidAmount();
    error NotEnabled();
    error PriceNotSet();

    uint8 public maxRewardRatio; // Share of the pool to be awarded in 1/256.
    uint256 public ticketPrice; // Required amount of tokens to be payed.

    uint8 winRatio; // Probability of a player to win in 1/256.
    uint256 public payouts; // Amount of payouts to date.

    bool enabled; // Kill switch.
    address owner; // Contract creator. This is the allowed manager and the withdrawal account.

    constructor()
    {
        owner = msg.sender;
    }

    function setEnabled(bool in_enabled) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        enabled = in_enabled;
    }

    function setOwner(address in_owner) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        owner = in_owner;
    }

    function setMaxRewardRatio(uint8 in_maxRewardRatio) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        maxRewardRatio = in_maxRewardRatio;
    }

    function setWinRatio(uint8 in_winRatio) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        winRatio = in_winRatio;
    }

    function setTicketPrice(uint256 in_ticketPrice) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        ticketPrice = in_ticketPrice;
    }

    function draw() external payable
    {
        if (msg.sender!=tx.origin) { // Should be run directly to avoid reverts.
            revert Forbidden();
        }
        if (msg.value!=ticketPrice) {
            revert InvalidAmount();
        }
        if (!enabled) {
            revert NotEnabled();
        }
        if (ticketPrice==0) { // Sanity check for the owner.
            revert PriceNotSet();
        }

        // Do the randomness stuff.
        bytes memory res = Sapphire.randomBytes(1, "");
        if (uint8(res[0]) < winRatio) {
            uint256 payout = address(this).balance / 256 * maxRewardRatio;
            payable(msg.sender).transfer(payout);
            payouts += payout;

            emit Win(msg.sender);
        } else {
            emit Lose(msg.sender);
        }
    }

    function withdraw(uint256 amount) external
    {
        if (msg.sender!=owner) {
            revert Forbidden();
        }
        payable(msg.sender).transfer(amount);
    }
}
