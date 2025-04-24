import { ethers } from "ethers";
import { parseMonadAmount, formatMonadAmount, MICRO_MONAD } from "./monad-utils";
import { auctionEvents } from "./utils";
import { AUTO_BIDDER_ADDRESS } from "./auto-bid-service";
import { mintPlayerNFT } from "./nft-contract";
import { BOT_WALLETS, getBotWalletByAddress, getBotWalletByName } from "./bot-wallets";
import type { AuctionPlayerInfo } from "@/types/player";

// Tracking bids in memory (in a production app, these would be in a database or smart contract)
interface BidInfo {
  bidder: string;
  amount: number; // in MONAD
  timestamp: number;
  botName?: string; // Optional bot name for AutoBidder bids
}

interface AuctionData {
  auctionId: number;
  playerId: number;
  seller: string;
  startingBid: number; // in MONAD
  endTime: number; // timestamp
  isActive: boolean;
  bids: BidInfo[];
  currentHighestBid: number; // in MONAD
  currentHighestBidder: string;
  isPaid?: boolean;
  paidAmount?: number;
  paidTimestamp?: number;
  isFinalized?: boolean; // Added to track finalized status
  nftTokenId?: number; // Added to track NFT token ID
  nftMinted?: boolean; // Added to track NFT mint status
  nftMintTimestamp?: number; // Added to track NFT mint timestamp
}

// In-memory auction data store (simulate blockchain)
const auctionStore: Record<number, AuctionData> = {};
let nextAuctionId = 1;

// Type definition for the auction contract methods
type AuctionContractMethods = ethers.Contract & {
  getCurrentAuction(): Promise<[bigint, string, bigint, bigint, boolean]>;
  getHighestBid(auctionId: number): Promise<bigint>;
  getHighestBidder(auctionId: number): Promise<string>;
  getAuctionEndTime(auctionId: number): Promise<bigint>;
  isAuctionActive(auctionId: number): Promise<boolean>;
  getPlayerMetadata(playerId: number): Promise<string>;
  createAuction(playerId: number, startingBid: bigint, duration: number): Promise<ethers.ContractTransactionResponse>;
  placeBid(auctionId: number, options?: { value: bigint }): Promise<ethers.ContractTransactionResponse>;
  endAuction(auctionId: number): Promise<ethers.ContractTransactionResponse>;
  cancelAuction(auctionId: number): Promise<ethers.ContractTransactionResponse>;
}

// Define AuctionContract type if missing
export type AuctionContract = any;

// Auction Contract ABI - Simplified for demo
const AUCTION_CONTRACT_ABI = [
  // Read functions
  "function getCurrentAuction() view returns (uint256, address, uint256, uint256, bool)",
  "function getHighestBid(uint256 auctionId) view returns (uint256)",
  "function getHighestBidder(uint256 auctionId) view returns (address)",
  "function getAuctionEndTime(uint256 auctionId) view returns (uint256)",
  "function isAuctionActive(uint256 auctionId) view returns (bool)",
  "function getPlayerMetadata(uint256 playerId) view returns (string)",

  // Write functions
  "function createAuction(uint256 playerId, uint256 startingBid, uint256 duration) returns (uint256)",
  "function placeBid(uint256 auctionId) payable returns (bool)",
  "function endAuction(uint256 auctionId) returns (address)",
  "function cancelAuction(uint256 auctionId) returns (bool)",

  // Events
  "event AuctionCreated(uint256 indexed auctionId, uint256 indexed playerId, uint256 startingBid, uint256 duration)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
  "event AuctionEnded(uint256 indexed auctionId, address winner, uint256 amount)",
  "event AuctionCancelled(uint256 indexed auctionId)"
];

// Export the contract address for use in other modules
export const AUCTION_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

// Minimum increment required for a new bid (in percentage)
export const MIN_BID_INCREMENT_PERCENT = 5;

// Store authorized AutoBidder contracts that can place bids on behalf of bots
const authorizedAutoBidders: string[] = [
  AUTO_BIDDER_ADDRESS
];

// Check if an address is an authorized AutoBidder
export const isAuthorizedAutoBidder = (address: string): boolean => {
  return authorizedAutoBidders.includes(address.toLowerCase());
};

// Function to get auction contract instance
export const getAuctionContract = async (
  provider: ethers.Provider,
  signer?: ethers.Signer
): Promise<AuctionContractMethods> => {
  const contractWithProvider = new ethers.Contract(
    AUCTION_CONTRACT_ADDRESS,
    AUCTION_CONTRACT_ABI,
    provider
  ) as AuctionContractMethods;

  // If signer is provided, return contract with signer
  if (signer) {
    return contractWithProvider.connect(signer) as AuctionContractMethods;
  }

  return contractWithProvider;
};

// Moderator address that will receive payments and generate NFTs
export const MODERATOR_ADDRESS = "0xDAcd7b2E80E2Bee4C5f6d5BBD683a56CE0130f46"; // Updated with actual moderator address

// BotPayment contract address - this must match the address in bot-bidding-service.ts
export const BOT_PAYMENT_CONTRACT_ADDRESS = "0xEBE1e2A8d6E57323A4D92d56eDD6635ccA6d3980";

// Minimal ABI for BotPayment contract
export const BOT_PAYMENT_CONTRACT_ABI = [
  "function payModerator() external payable returns (bool)",
  "function moderator() external view returns (address)",
  "function getBotPayments(address bot) external view returns (uint256)"
];

// Mapping to track finalized auctions
const finalizedAuctions = new Map();

// Check if an address belongs to an AI bot
export const isAIBotAddress = (address: string | null | undefined): boolean => {
  // Return false for null or undefined addresses
  if (!address) return false;
  
  // Normalize address for case-insensitive comparison
  const normalizedAddress = address.toLowerCase();
  
  // Check against known bot wallets
  return BOT_WALLETS.some(bot => 
    bot.address.toLowerCase() === normalizedAddress
  );
};

/**
 * Create a player auction
 * @param contract The auction contract instance
 * @param player The player to auction
 * @param startingPrice The starting price for the auction
 * @param duration The duration of the auction in seconds
 * @param teamOwner The address of the team owner creating the auction
 */
export const createPlayerAuction = async (
  contract: AuctionContract,
  player: AuctionPlayerInfo,
  startingPrice: string,
  duration: number = 120,
  teamOwner: string
): Promise<{ auctionId: string; status: string }> => {
  try {
    console.log(`Creating auction for player ${player.name} with starting price ${startingPrice}`);
    
    const auctionId = `auction_${Date.now()}_${player.id}`;
    const parsedStartingPrice = contract.utils.parseEther(startingPrice);
    
    // For dev environment, store auction data in localStorage
    const auctions = JSON.parse(localStorage.getItem("auctions") || "{}");
    
    auctions[auctionId] = {
      id: auctionId,
      player,
      startingPrice: parsedStartingPrice.toString(),
      currentBid: parsedStartingPrice.toString(),
      highestBidder: null,
      endTime: Math.floor(Date.now() / 1000) + duration,
      status: "active",
      teamOwner,
      bidHistory: [],
      createdAt: Date.now()
    };
    
    localStorage.setItem("auctions", JSON.stringify(auctions));
    
    console.log(`Auction created successfully with ID: ${auctionId}`);
    return { auctionId, status: "success" };
  } catch (error: any) {
    console.error("Failed to create auction:", error);
    throw new Error(`Failed to create auction: ${error.message}`);
  }
};

/**
 * Get all active auctions
 * @param contract The auction contract instance
 */
export const getActiveAuctions = async (contract: AuctionContract): Promise<any[]> => {
  try {
    // Retrieve auctions from localStorage for development
    const auctions = JSON.parse(localStorage.getItem("auctions") || "{}");
    const now = Math.floor(Date.now() / 1000);
    
    // Filter active auctions
    const activeAuctions = Object.values(auctions).filter((auction: any) => {
      return auction.status === "active" && auction.endTime > now;
    });
    
    return activeAuctions;
  } catch (error) {
    console.error("Failed to get active auctions:", error);
    return [];
  }
};

/**
 * Place a bid on an auction
 * @param contract The auction contract instance
 * @param auctionId The ID of the auction
 * @param bidAmount The amount to bid
 * @param bidderAddress The address of the bidder
 */
export const placeBid = async (
  contract: AuctionContract,
  auctionId: string,
  bidAmount: string,
  bidderAddress: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Placing bid of ${bidAmount} on auction ${auctionId} by ${bidderAddress}`);
    
    // For dev environment, update auction data in localStorage
    const auctions = JSON.parse(localStorage.getItem("auctions") || "{}");
    const auction = auctions[auctionId];
    
    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`);
    }
    
    if (auction.status !== "active") {
      throw new Error(`Auction ${auctionId} is not active`);
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (auction.endTime < now) {
      auction.status = "ended";
      localStorage.setItem("auctions", JSON.stringify(auctions));
      throw new Error(`Auction ${auctionId} has ended`);
    }
    
    const parsedBidAmount = contract.utils.parseEther(bidAmount);
    const currentBid = BigInt(auction.currentBid);
    
    if (parsedBidAmount <= currentBid) {
      throw new Error(`Bid amount must be greater than current bid of ${contract.utils.formatEther(currentBid)}`);
    }
    
    // Update auction with new bid
    auction.currentBid = parsedBidAmount.toString();
    auction.highestBidder = bidderAddress;
    auction.bidHistory.push({
      bidder: bidderAddress,
      amount: parsedBidAmount.toString(),
      timestamp: now
    });
    
    // Extend auction time if bid is placed in last 30 seconds
    if (auction.endTime - now < 30) {
      auction.endTime = now + 30; // Extend by 30 seconds
    }
    
    localStorage.setItem("auctions", JSON.stringify(auctions));
    
    console.log(`Bid placed successfully on auction ${auctionId}`);
    return { success: true, message: "Bid placed successfully" };
  } catch (error: any) {
    console.error("Failed to place bid:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Get auction details by ID
 * @param contract The auction contract instance
 * @param auctionId The ID of the auction
 */
export const getAuctionDetails = async (contract: AuctionContract, auctionId: string): Promise<any> => {
  try {
    // Retrieve auction from localStorage for development
    const auctions = JSON.parse(localStorage.getItem("auctions") || "{}");
    const auction = auctions[auctionId];
    
    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`);
    }
    
    // Check if auction has ended
    const now = Math.floor(Date.now() / 1000);
    if (auction.status === "active" && auction.endTime < now) {
      // FIXED: Set status correctly based on whether there's a highest bidder
      if (auction.currentHighestBidder) {
        auction.status = "ended";
      } else {
        auction.status = "unsold";
      }
      localStorage.setItem("auctions", JSON.stringify(auctions));
    }
    
    return auction;
  } catch (error) {
    console.error(`Failed to get auction ${auctionId} details:`, error);
    return null;
  }
};

/**
 * End auction and transfer player to the highest bidder
 * @param contract The auction contract instance
 * @param auctionId The ID of the auction
 */
export const finalizeAuction = async (
  contract: AuctionContract,
  auctionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Finalizing auction ${auctionId}`);
    
    // For dev environment, update auction data in localStorage
    const auctions = JSON.parse(localStorage.getItem("auctions") || "{}");
    const auction = auctions[auctionId];
    
    if (!auction) {
      throw new Error(`Auction ${auctionId} not found`);
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (auction.endTime > now) {
      throw new Error(`Auction ${auctionId} has not ended yet`);
    }
    
    if (auction.status !== "active" && auction.status !== "ended") {
      throw new Error(`Auction ${auctionId} is already finalized`);
    }
    
    // Update auction status
    auction.status = "finalized";
    auction.finalizedAt = now;
    
    // All payments route to the moderator address
    auction.paymentRecipient = MODERATOR_ADDRESS;
    
    localStorage.setItem("auctions", JSON.stringify(auctions));
    
    console.log(`Auction ${auctionId} finalized successfully - payment directed to moderator address: ${MODERATOR_ADDRESS}`);
    return { success: true, message: "Auction finalized successfully" };
  } catch (error: any) {
    console.error("Failed to finalize auction:", error);
    return { success: false, message: error.message };
  }
};