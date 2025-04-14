import { ethers } from "ethers";
import { connectWallet, MONAD_CONFIG } from "./monad-utils";

// NFT Contract ABI - simplified version focused on minting and transfer
const NFT_CONTRACT_ABI = [
  // View functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  
  // Transaction functions
  "function mint(address to, string memory tokenURI) returns (uint256)",
  "function transfer(address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
];

// IPL Player NFT Contract Address on Monad Testnet
export const NFT_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual contract address

export interface IPLPlayerNFT {
  tokenId: number;
  name: string;
  team: string;
  role: string;
  basePrice: number; // in MONAD
  imageUri: string;
  stats: {
    battingAvg?: number;
    bowlingAvg?: number;
    strikeRate?: number;
    economy?: number;
    matchesPlayed: number;
  };
}

// Function to initialize the NFT contract
export const getNFTContract = async (signer?: ethers.Signer) => {
  try {
    if (!signer) {
      const walletConnection = await connectWallet();
      if (!walletConnection.success) {
        throw new Error(walletConnection.error || "Failed to connect wallet");
      }
      signer = walletConnection.signer;
    }
    
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
  } catch (error: any) {
    console.error("Error initializing NFT contract:", error);
    throw error;
  }
};

// Function to mint a new IPL Player NFT
export const mintPlayerNFT = async (
  player: IPLPlayerNFT,
  recipientAddress: string,
  signer?: ethers.Signer
): Promise<{
  success: boolean;
  tokenId?: number;
  txHash?: string;
  error?: string;
}> => {
  try {
    // Prepare player metadata
    const metadata = {
      name: player.name,
      description: `${player.name} - ${player.role} - ${player.team}`,
      image: player.imageUri,
      attributes: [
        { trait_type: "Team", value: player.team },
        { trait_type: "Role", value: player.role },
        { trait_type: "Base Price", value: player.basePrice.toString() },
        { trait_type: "Matches Played", value: player.stats.matchesPlayed.toString() }
      ]
    };
    
    // Add conditional statistics based on player role
    if (player.stats.battingAvg) {
      metadata.attributes.push({ trait_type: "Batting Average", value: player.stats.battingAvg.toString() });
    }
    if (player.stats.bowlingAvg) {
      metadata.attributes.push({ trait_type: "Bowling Average", value: player.stats.bowlingAvg.toString() });
    }
    if (player.stats.strikeRate) {
      metadata.attributes.push({ trait_type: "Strike Rate", value: player.stats.strikeRate.toString() });
    }
    if (player.stats.economy) {
      metadata.attributes.push({ trait_type: "Economy", value: player.stats.economy.toString() });
    }
    
    // Convert metadata to JSON and upload to IPFS (simplified for now)
    // In a real implementation, you would upload this to IPFS or another decentralized storage
    const tokenURI = `ipfs://QmExample/${player.name.replace(/\s+/g, '')}.json`;
    
    // Get the contract instance
    const nftContract = await getNFTContract(signer);
    
    // Mint the NFT
    const tx = await nftContract.mint(recipientAddress, tokenURI);
    const receipt = await tx.wait();
    
    // Extract token ID from event logs (simplified)
    const transferEvent = receipt.logs
      .filter((log: any) => log.fragment?.name === "Transfer")
      .map((log: any) => ({
        tokenId: log.args[2]
      }))[0];
    
    return {
      success: true,
      tokenId: Number(transferEvent.tokenId),
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to mint NFT"
    };
  }
};

// Function to get owned NFTs for an address
export const getPlayerNFTs = async (
  ownerAddress: string,
  signer?: ethers.Signer
): Promise<{
  success: boolean;
  nfts?: IPLPlayerNFT[];
  error?: string;
}> => {
  try {
    const nftContract = await getNFTContract(signer);
    
    // Get balance (number of NFTs owned)
    const balance = await nftContract.balanceOf(ownerAddress);
    
    // This is a simplified implementation
    // In a real implementation, you would need to:
    // 1. Get all token IDs owned by the address (requires contract enumeration or event indexing)
    // 2. Fetch metadata for each token from its tokenURI
    
    // Placeholder for demo
    const nfts: IPLPlayerNFT[] = [];
    // Normally would loop through tokens and fetch metadata
    
    return {
      success: true,
      nfts
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get NFTs"
    };
  }
};

// Function to transfer an NFT to another address
export const transferNFT = async (
  tokenId: number,
  toAddress: string,
  signer?: ethers.Signer
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    const nftContract = await getNFTContract(signer);
    
    // Transfer the NFT
    const tx = await nftContract.transfer(toAddress, tokenId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to transfer NFT"
    };
  }
};

// Function to approve an address to manage an NFT
export const approveNFT = async (
  tokenId: number,
  operatorAddress: string,
  signer?: ethers.Signer
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    const nftContract = await getNFTContract(signer);
    
    // Approve the operator
    const tx = await nftContract.approve(operatorAddress, tokenId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to approve NFT"
    };
  }
};