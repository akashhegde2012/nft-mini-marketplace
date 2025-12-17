// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    NFT mini marketplace
*/

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract SimpleNFTMarketplace {
    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 price; // in wei
        bool active;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    /* =====================
            LIST NFT
       ===================== */
    function listNFT(
        address nft,
        uint256 tokenId,
        uint256 price
    ) external {
        require(price > 0, "Price must be > 0");

        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            token.getApproved(tokenId) == address(this) ||
            token.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            price: price,
            active: true
        });
    }

    /* =====================
            BUY NFT
       ===================== */
    function buyNFT(uint256 listingId) external payable {
        Listing storage item = listings[listingId];
        require(item.active, "Not active");
        require(msg.value == item.price, "Incorrect price");

        item.active = false;

        // transfer NFT
        IERC721(item.nft).safeTransferFrom(
            item.seller,
            msg.sender,
            item.tokenId
        );

        // pay seller
        payable(item.seller).transfer(msg.value);
    }

    /* =====================
         CANCEL LISTING
       ===================== */
    function cancelListing(uint256 listingId) external {
        Listing storage item = listings[listingId];
        require(item.active, "Not active");
        require(item.seller == msg.sender, "Not seller");

        item.active = false;
    }
}
