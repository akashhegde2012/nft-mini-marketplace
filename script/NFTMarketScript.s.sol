// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NFTMarket} from "../src/NFTMarket.sol";

contract NFTMarketScript is Script {
    NFTMarket public nft;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        nft = new NFTMarket();

        vm.stopBroadcast();
    }
}
