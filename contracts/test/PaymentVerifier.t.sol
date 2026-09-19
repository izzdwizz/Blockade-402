// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {PaymentVerifier} from "../src/PaymentVerifier.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract PaymentVerifierTest is Test {
    PaymentVerifier internal verifier;
    MockUSDC internal usdc;

    address internal payer = address(0xBEEF);
    address internal resource = address(0xCAFE);

    uint256 internal constant MIN_PRICE = 1e4; // 0.01 USDC (6 decimals)

    function setUp() public {
        usdc = new MockUSDC();
        verifier = new PaymentVerifier(address(usdc), MIN_PRICE);

        usdc.mint(payer, 1_000_000e6);
        vm.prank(payer);
        usdc.approve(address(verifier), type(uint256).max);
    }

    function test_RevertsOnUnderpayment() public {
        bytes32 requestHash = keccak256("request-1");
        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(PaymentVerifier.Underpayment.selector, MIN_PRICE - 1, MIN_PRICE)
        );
        verifier.pay(resource, MIN_PRICE - 1, requestHash);
    }

    function test_TransfersUSDCAndEmitsEvent() public {
        bytes32 requestHash = keccak256("request-2");
        uint256 resourceBalanceBefore = usdc.balanceOf(resource);
        uint256 payerBalanceBefore = usdc.balanceOf(payer);

        vm.expectEmit(true, true, true, true, address(verifier));
        emit PaymentVerifier.PaymentSettled(payer, resource, requestHash, MIN_PRICE, block.timestamp);

        vm.prank(payer);
        verifier.pay(resource, MIN_PRICE, requestHash);

        assertEq(usdc.balanceOf(resource), resourceBalanceBefore + MIN_PRICE);
        assertEq(usdc.balanceOf(payer), payerBalanceBefore - MIN_PRICE);
        assertTrue(verifier.settledRequests(requestHash));
    }

    function test_RevertsOnReplayedRequestHash() public {
        bytes32 requestHash = keccak256("request-3");

        vm.prank(payer);
        verifier.pay(resource, MIN_PRICE, requestHash);

        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(PaymentVerifier.RequestAlreadySettled.selector, requestHash)
        );
        verifier.pay(resource, MIN_PRICE, requestHash);
    }

    function test_EventCarriesCorrectRequestHash() public {
        bytes32 requestHash = keccak256("request-4-unique");

        vm.recordLogs();
        vm.prank(payer);
        verifier.pay(resource, MIN_PRICE, requestHash);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 sig = keccak256("PaymentSettled(address,address,bytes32,uint256,uint256)");
        bool found = false;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == sig) {
                assertEq(entries[i].topics[1], bytes32(uint256(uint160(payer))));
                assertEq(entries[i].topics[2], bytes32(uint256(uint160(resource))));
                assertEq(entries[i].topics[3], requestHash);
                found = true;
            }
        }
        assertTrue(found, "PaymentSettled event not found");
    }
}
