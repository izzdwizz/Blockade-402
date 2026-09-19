// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PaymentVerifier} from "../src/PaymentVerifier.sol";

/// @notice Deploys PaymentVerifier against USDC_ADDRESS and MIN_PRICE from env.
/// Usage: forge script script/Deploy.s.sol --rpc-url $ARC_RPC --broadcast
contract DeployScript is Script {
    function run() external returns (PaymentVerifier verifier) {
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        uint256 minPrice = vm.envUint("MIN_PRICE");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        verifier = new PaymentVerifier(usdcAddress, minPrice);
        vm.stopBroadcast();

        console.log("PaymentVerifier deployed at:", address(verifier));
    }
}
