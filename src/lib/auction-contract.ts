import { ethers } from "ethers";
import { parseMonadAmount, MICRO_MONAD } from "./monad-utils";

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

// Replace with your deployed contract address
export const AUCTION_CONTRACT_ADDRESS = "0x9654DE78c65A214f12E3e5f3c92E19E11eD123f3";

// Minimum increment required for a new bid (in percentage)
export const MIN_BID_INCREMENT_PERCENT = 5;

// Function to get auction contract instance
export const getAuctionContract = async (
  provider: ethers.Provider,
  signer?: ethers.Signer
) => {
  const contractWithProvider = new ethers.Contract(
    AUCTION_CONTRACT_ADDRESS,
    AUCTION_CONTRACT_ABI,
    provider
  );
  
  // If signer is provided, return contract with signer
  if (signer) {
    return contractWithProvider.connect(signer);
  }
  
  return contractWithProvider;
};

// Function to create a new auction for a player
export const createPlayerAuction = async (
  signer: ethers.Signer,
  playerId: number,
  startingBid: number, // in MONAD
  durationInMinutes: number
): Promise<{
  success: boolean;
  auctionId?: number;
  txHash?: string;
  error?: string;
}> => {
  try {
    const provider = signer.provider as ethers.Provider;
    const contract = await getAuctionContract(provider, signer);
    
    // Convert duration to seconds
    const durationInSeconds = durationInMinutes * 60;
    
    // Convert starting bid to wei
    const startingBidInWei = parseMonadAmount(startingBid);
    
    // Create auction
    const tx = await contract.createAuction(playerId, startingBidInWei, durationInSeconds);
    const receipt = await tx.wait();
    
    // Get auction ID from event logs (simplified)
    // In a real implementation, you would parse the event logs to get the auctionId
    const auctionId = 1; // Mock ID for demonstration
    
    return {
      success: true,
      auctionId,
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create auction"
    };
  }
};

// Function to place a bid on an auction
export const placeBid = async (
  signer: ethers.Signer,
  auctionId: number,
  bidAmount: number // in MONAD
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    const provider = signer.provider as ethers.Provider;
    const contract = await getAuctionContract(provider, signer);
    
    // Convert bid amount to wei
    const bidAmountInWei = parseMonadAmount(bidAmount);
    
    // Place bid
    const tx = await contract.placeBid(auctionId, {
      value: bidAmountInWei
    });
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to place bid"
    };
  }
};

// Function to get current auction details
export const getCurrentAuction = async (
  provider: ethers.Provider
): Promise<{
  success: boolean;
  auction?: {
    auctionId: number;
    playerId: number;
    currentBid: number; // in MONAD
    endTime: Date;
    isActive: boolean;
  };
  error?: string;
}> => {
  try {
    const contract = await getAuctionContract(provider);
    
    // Get current auction
    const [playerId, highestBidder, highestBidWei, endTimeSeconds, isActive] = 
      await contract.getCurrentAuction();
    
    // Convert wei to MONAD
    const currentBid = Number(ethers.formatEther(highestBidWei));
    
    // Convert timestamp to Date
    const endTime = new Date(endTimeSeconds.toNumber() * 1000);
    
    return {
      success: true,
      auction: {
        auctionId: 1, // Mock ID for demonstration
        playerId: playerId.toNumber(),
        currentBid,
        endTime,
        isActive
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get current auction"
    };
  }
};

// Function to end an auction
export const endAuction = async (
  signer: ethers.Signer,
  auctionId: number
): Promise<{
  success: boolean;
  winner?: string;
  finalBid?: number; // in MONAD
  txHash?: string;
  error?: string;
}> => {
  try {
    const provider = signer.provider as ethers.Provider;
    const contract = await getAuctionContract(provider, signer);
    
    // End auction
    const tx = await contract.endAuction(auctionId);
    const receipt = await tx.wait();
    
    // Get highest bidder and bid
    const highestBidder = await contract.getHighestBidder(auctionId);
    const highestBidWei = await contract.getHighestBid(auctionId);
    const finalBid = Number(ethers.formatEther(highestBidWei));
    
    return {
      success: true,
      winner: highestBidder,
      finalBid,
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to end auction"
    };
  }
};