// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Thin settlement rail for x402-style USDC payments. Pulls USDC from a
/// payer straight to a resource owner and emits proof of settlement — no custody,
/// no balance tracking. requestHash prevents the same request from being paid twice.
contract PaymentVerifier {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public owner;
    uint256 public minPrice;

    mapping(bytes32 => bool) public settledRequests;

    event PaymentSettled(
        address indexed payer,
        address indexed resource,
        bytes32 indexed requestHash,
        uint256 amount,
        uint256 timestamp
    );

    error Underpayment(uint256 sent, uint256 required);
    error RequestAlreadySettled(bytes32 requestHash);
    error NotOwner();

    constructor(address usdcToken, uint256 initialMinPrice) {
        usdc = IERC20(usdcToken);
        minPrice = initialMinPrice;
        owner = msg.sender;
    }

    function setMinPrice(uint256 newMinPrice) external {
        if (msg.sender != owner) revert NotOwner();
        minPrice = newMinPrice;
    }

    function pay(address resource, uint256 amount, bytes32 requestHash) external {
        if (amount < minPrice) revert Underpayment(amount, minPrice);
        if (settledRequests[requestHash]) revert RequestAlreadySettled(requestHash);

        settledRequests[requestHash] = true;
        usdc.safeTransferFrom(msg.sender, resource, amount);

        emit PaymentSettled(msg.sender, resource, requestHash, amount, block.timestamp);
    }
}
