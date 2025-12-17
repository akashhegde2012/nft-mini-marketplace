"use client";

import { useEffect, useState } from "react";
import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";


type Listing = {
  id: number;
  seller: string;
  nft: string;
  tokenId: string;
  price: string;
};

// 🔁 Replace with your deployed marketplace address (Sepolia)
const MARKETPLACE_ADDRESS = "0xcb9c9eba0bf4b283989db324b0846bf506f70250";

// 🔁 Replace with your NFT contract address
const NFT_ADDRESS = "0xc52bAf20d56c50372e42D192E27272CC44B3b554";

// Minimal ABI – ONLY 3 MAIN FUNCTIONS + reads
// Marketplace ABI
const marketplaceABI = [
  "function listNFT(address nft,uint256 tokenId,uint256 price)",
  "function buyNFT(uint256 listingId) payable",
  "function cancelListing(uint256 listingId)",
  "function listings(uint256) view returns (address seller,address nft,uint256 tokenId,uint256 price,bool active)",
  "function listingCount() view returns (uint256)"
];

// NFT ABI (approval only)
const nftABI = [
  "function setApprovalForAll(address operator,bool approved)",
  "function isApprovedForAll(address owner,address operator) view returns (bool)"
];

export default function Marketplace() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);

  /* ================= CONNECT WALLET ================= */
  async function connectWallet() {
    const ethereum = (window as any).ethereum;

    if (!ethereum) return alert("Install MetaMask");

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    setProvider(provider);
    setSigner(signer);
    setAccount(await signer.getAddress());
  }

  /* ================= LOAD LISTINGS ================= */
  async function loadListings() {
    if (!provider) return;

    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      marketplaceABI,
      provider
    );

    const count = await contract.listingCount();
    const items = [];

    for (let i = 1; i <= count; i++) {
      const l = await contract.listings(i);
      if (l.active) {
        items.push({
          id: i,
          seller: l.seller,
          nft: l.nft,
          tokenId: l.tokenId.toString(),
          price: ethers.formatEther(l.price)
        });
      }
    }

    setListings(items);
  }

  /* ================= LIST NFT ================= */
  /* ================= APPROVE MARKETPLACE ================= */
  async function approveMarketplace() {
    const nft = new ethers.Contract(NFT_ADDRESS, nftABI, signer);

    const tx = await nft.setApprovalForAll(MARKETPLACE_ADDRESS, true);
    await tx.wait();

    alert("Marketplace approved for NFT transfers");
  }

  async function listNFT() {
    const nft = prompt("NFT Contract Address");
    const tokenId = prompt("Token ID");
    const price = prompt("Price in ETH");

    if (!nft || !tokenId || !price) return;

    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      marketplaceABI,
      signer
    );

    const tx = await contract.listNFT(
      nft,
      tokenId,
      ethers.parseEther(price)
    );
    await tx.wait();

    loadListings();
  }

  /* ================= BUY NFT ================= */
  async function buyNFT(id: number, price: string) {
    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      marketplaceABI,
      signer
    );

    const tx = await contract.buyNFT(id, {
      value: ethers.parseEther(price)
    });
    await tx.wait();

    loadListings();
  }

  /* ================= CANCEL LISTING ================= */
  async function cancelListing(id: number) {
    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      marketplaceABI,
      signer
    );

    const tx = await contract.cancelListing(id);
    await tx.wait();

    loadListings();
  }

  useEffect(() => {
    if (provider) loadListings();
  }, [provider]);

  return (
    <main className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">NFT Mini Marketplace (Sepolia)</h1>

      {!account ? (
        <button onClick={connectWallet} className="w-full bg-blue-600 text-white py-2 rounded-lg">Connect Wallet</button>
      ) : (
        <p className="text-sm text-center break-all">Connected: {account}</p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={approveMarketplace} className="w-full bg-green-600 text-white py-2 rounded-lg">Approve Marketplace</button>
        <button onClick={listNFT} className="w-full bg-purple-600 text-white py-2 rounded-lg">List NFT</button>
      </div>

      <h2 className="text-lg font-semibold">Active Listings</h2>

      {listings.map((l) => (
        <div key={l.id} className="border rounded-lg p-3 space-y-1 text-sm">
          <p><b>Listing ID:</b> {l.id}</p>
          <p><b>NFT:</b> {l.nft}</p>
          <p><b>Token ID:</b> {l.tokenId}</p>
          <p><b>Price:</b> {l.price} ETH</p>

          {account === l.seller ? (
            <button onClick={() => cancelListing(l.id)} className="w-full bg-red-500 text-white py-1 rounded-md">Cancel</button>
          ) : (
            <button onClick={() => buyNFT(l.id, l.price)} className="w-full bg-blue-500 text-white py-1 rounded-md">Buy</button>
          )}
        </div>
      ))}
    </div>
    </main>
  );
}
