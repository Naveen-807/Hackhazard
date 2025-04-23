import { ethers } from "ethers";
import { AUCTION_CONTRACT_ADDRESS } from "./auction-contract";
import { getBotSigner, getBotWalletByName, loadBotWallets } from "./bot-wallets";

// ABI for the AutoBidder contract - only including functions we'll use
const AUTO_BIDDER_ABI = [
  "function registerBidder(string memory _name, address _bidderAddress, uint256 _maxBidAmount, uint256 _bidIncrement, uint256 _bidProbability, string memory _strategy) public returns (bytes32)",
  "function placeBotBid(bytes32 _bidderId, uint256 _auctionId, uint256 _currentBid) public returns (bool success, uint256 bidAmount)",
  "function getAllBidderIds() public view returns (bytes32[] memory)",
  "function getBidderConfig(bytes32 _bidderId) public view returns (tuple(address bidderAddress, string name, bool isActive, uint256 maxBidAmount, uint256 bidIncrement, uint256 bidProbability, string strategy))",
  "event AutoBidPlaced(bytes32 indexed bidderId, uint256 auctionId, uint256 amount)"
];

// Contract interface for direct bidding without the AutoBidder contract
const AUCTION_CONTRACT_ABI = [
  "function placeBid(uint256 auctionId) payable returns (bool)",
  "function getCurrentAuction() view returns (uint256, address, uint256, uint256, bool)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)"
];

// Default address for the deployed AutoBidder contract - replace with your deployed contract address
export const AUTO_BIDDER_ADDRESS = "0x9654DE78c65A214f12E3e5f3c92E19E11eD123f3";

// Map to store bidder IDs by name
const bidderIdsByName: Record<string, string> = {};

/**
 * Get the AutoBidder contract instance
 */
export const getAutoBidderContract = async (
  provider: ethers.Provider,
  signer?: ethers.Signer
): Promise<ethers.Contract> => {
  const contract = new ethers.Contract(
    AUTO_BIDDER_ADDRESS,
    AUTO_BIDDER_ABI,
    provider
  );
  
  if (signer) {
    return contract.connect(signer) as ethers.Contract;
  }
  
  return contract as ethers.Contract;
};

/**
 * Initialize the AutoBidder contract with bot wallets
 */
export const initializeAutoBidder = async (
  signer: ethers.Signer
): Promise<boolean> => {
  try {
    const botWallets = await loadBotWallets();
    const contract = await getAutoBidderContract(signer.provider as ethers.Provider, signer);
    
    console.log(`Initializing AutoBidder with ${botWallets.length} bots`);
    
    // Register each bot in the contract
    for (const bot of botWallets) {
      // Convert strategy to the format expected by the contract
      const strategyMap: Record<string, string> = {
        "balanced": "balanced",
        "aggressive": "aggressive",
        "smart": "conservative", 
      };
      const strategy = strategyMap[bot.strategy ?? "balanced"] || "balanced";
      
      // Convert balance to wei
      const maxBidAmount = ethers.parseEther(bot.balance.toString());
      
      // Set bid increment based on strategy (in basis points)
      const bidIncrementMap: Record<string, number> = {
        "aggressive": 500, // 5%
        "balanced": 300,   // 3%
        "conservative": 200 // 2%
      };
      const bidIncrement = bidIncrementMap[strategy] || 300;
      
      // Set bid probability based on strategy (0-100)
      const bidProbabilityMap: Record<string, number> = {
        "aggressive": 70,
        "balanced": 50,
        "conservative": 30
      };
      const bidProbability = bidProbabilityMap[strategy] || 50;
      
      console.log(`Registering bot: ${bot.name} with strategy ${strategy}`);
      
      try {
        const tx = await contract.registerBidder(
          bot.name,
          bot.address,
          maxBidAmount,
          bidIncrement,
          bidProbability,
          strategy
        );
        
        const receipt = await tx.wait();
        console.log(`Bot ${bot.name} registered with tx hash: ${receipt.hash}`);
        
        // Extract the bidder ID from the emitted event
        for (const log of receipt.logs) {
          try {
            const event = contract.interface.parseLog(log);
            if (event && event.name === "BidderRegistered") {
              const bidderId = event.args[0]; // First indexed parameter is the bidderId
              bidderIdsByName[bot.name] = bidderId;
              console.log(`Stored bidder ID for ${bot.name}: ${bidderId}`);
            }
          } catch (e) {
            // Not all logs can be parsed as our event
          }
        }
      } catch (error: any) {
        // If the error indicates the bidder already exists, just log it
        if (error.message.includes("already registered")) {
          console.log(`Bot ${bot.name} already registered`);
        } else {
          console.error(`Error registering bot ${bot.name}:`, error);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing AutoBidder:", error);
    return false;
  }
};

/**
 * Place an automatic bid using the AutoBidder contract
 */
export const placeAutoBid = async (
  signer: ethers.Signer,
  botName: string,
  auctionId: number,
  currentBid: number
): Promise<{
  success: boolean;
  bidAmount?: number;
  error?: string;
}> => {
  try {
    const contract = await getAutoBidderContract(signer.provider as ethers.Provider, signer);
    
    // If we don't have the bidder ID yet, try to fetch all bidder IDs and match by name
    if (!bidderIdsByName[botName]) {
      try {
        const allBidderIds = await contract.getAllBidderIds();
        for (const bidderId of allBidderIds) {
          const config = await contract.getBidderConfig(bidderId);
          if (config.name === botName) {
            bidderIdsByName[botName] = bidderId;
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching bidder IDs:", error);
      }
    }
    
    const bidderId = bidderIdsByName[botName];
    if (!bidderId) {
      return {
        success: false,
        error: `Bidder ID not found for bot ${botName}`
      };
    }
    
    // Convert bid amount to wei
    const currentBidWei = ethers.parseEther(currentBid.toString());
    
    console.log(`Placing auto bid for ${botName} (ID: ${bidderId}) on auction ${auctionId} with current bid ${currentBid}`);
    
    const tx = await contract.placeBotBid(bidderId, auctionId, currentBidWei);
    const receipt = await tx.wait();
    
    // Parse the event to get the actual bid amount
    let bidAmount = 0;
    for (const log of receipt.logs) {
      try {
        const event = contract.interface.parseLog(log);
        if (event && event.name === "AutoBidPlaced") {
          bidAmount = parseFloat(ethers.formatEther(event.args.amount));
          break;
        }
      } catch (e) {
        // Not all logs can be parsed as our event
      }
    }
    
    return {
      success: true,
      bidAmount
    };
  } catch (error: any) {
    console.error(`Error placing auto bid for ${botName}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error placing auto bid"
    };
  }
};

/**
 * Deploy the AutoBidder contract
 * This function would be used once to deploy the contract
 */
export const deployAutoBidderContract = async (
  signer: ethers.Signer
): Promise<{
  success: boolean;
  contractAddress?: string;
  error?: string;
}> => {
  try {
    console.log("Deploying AutoBidder contract...");
    
    // Contract bytecode and ABI would come from compiled contract
    const AutoBidderFactory = new ethers.ContractFactory(
      AUTO_BIDDER_ABI,
      "0x...", // Bytecode would go here after compiling the contract
      signer
    );
    
    // Deploy with auction contract address as constructor parameter
    const contract = await AutoBidderFactory.deploy(AUCTION_CONTRACT_ADDRESS);
    
    // Wait for deployment (instead of using .deployed())
    const deployedContract = await contract.waitForDeployment();
    
    // Get the contract address
    const contractAddress = await deployedContract.getAddress();
    console.log("AutoBidder contract deployed at:", contractAddress);
    
    return {
      success: true,
      contractAddress
    };
  } catch (error: any) {
    console.error("Error deploying AutoBidder contract:", error);
    return {
      success: false,
      error: error.message || "Unknown error deploying contract"
    };
  }
};

/**
 * Place an automatic bid directly from a bot wallet
 */
export const placeDirectBotBid = async (
  provider: ethers.Provider,
  botName: string,
  auctionId: number,
  bidAmount: number
): Promise<{
  success: boolean;
  bidAmount?: number;
  txHash?: string;
  error?: string;
}> => {
  try {
    // Get the bot wallet
    const botWallet = getBotWalletByName(botName);
    if (!botWallet) {
      return {
        success: false,
        error: `Bot wallet not found for ${botName}`
      };
    }

    console.log(`Placing direct bid from ${botName} (${botWallet.address}) of ${bidAmount} MONAD`);

    // Get the signer for this specific bot
    const signer = await getBotSigner(provider, botWallet.address);
    if (!signer) {
      return {
        success: false,
        error: `Could not create signer for bot ${botName}`
      };
    }

    // Create the auction contract instance with this specific bot's signer
    const contract = new ethers.Contract(
      AUCTION_CONTRACT_ADDRESS,
      AUCTION_CONTRACT_ABI,
      signer
    );

    // Convert bid amount to wei
    const bidAmountWei = ethers.parseEther(bidAmount.toString());

    // Place the bid directly from the bot's wallet
    console.log(`Submitting bid transaction from ${botName} with amount ${bidAmount} MONAD`);
    const tx = await contract.placeBid(auctionId, { value: bidAmountWei });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`Bid transaction confirmed: ${receipt.hash}`);

    return {
      success: true,
      bidAmount: bidAmount,
      txHash: receipt.hash
    };
  } catch (error: any) {
    console.error(`Error placing direct bot bid for ${botName}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error placing direct bot bid"
    };
  }
};

/**
 * Initialize all bot wallets and ensure they have enough balance
 */
export const initializeBotWallets = async (provider: ethers.Provider): Promise<boolean> => {
  try {
    const botWallets = await loadBotWallets();
    console.log(`Initializing ${botWallets.length} bot wallets`);
    
    // Check each bot wallet's balance
    for (const bot of botWallets) {
      try {
        const address = bot.address;
        const balance = await provider.getBalance(address);
        const balanceInEther = parseFloat(ethers.formatEther(balance));
        
        console.log(`${bot.name} (${address}) has balance: ${balanceInEther} MONAD`);
        
        // Update the in-memory balance for reference
        bot.balance = balanceInEther;
      } catch (error) {
        console.error(`Error checking balance for ${bot.name}:`, error);
      }
    }
    
    console.log('All bot wallets initialized successfully');
    return true;
  } catch (error) {
    console.error("Error initializing bot wallets:", error);
    return false;
  }
};

/**
 * Test transaction to verify wallet functionality
 */
export const testBotWallet = async (
  provider: ethers.Provider,
  botName: string
): Promise<{
  success: boolean;
  address?: string;
  balance?: string;
  error?: string;
}> => {
  try {
    const botWallet = getBotWalletByName(botName);
    if (!botWallet) {
      return {
        success: false,
        error: `Bot wallet not found for ${botName}`
      };
    }

    // Get the signer for this bot
    const signer = await getBotSigner(provider, botWallet.address);
    if (!signer) {
      return {
        success: false,
        error: `Could not create signer for bot ${botName}`
      };
    }

    // Get the wallet address and balance
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const balanceInEther = ethers.formatEther(balance);

    console.log(`Bot wallet ${botName} verified - Address: ${address}, Balance: ${balanceInEther} MONAD`);

    return {
      success: true,
      address: address,
      balance: balanceInEther
    };
  } catch (error: any) {
    console.error(`Error testing bot wallet for ${botName}:`, error);
    return {
      success: false,
      error: error.message || "Unknown error testing bot wallet"
    };
  }
};

/**
 * AutoBidService class for managing auto-bidding
 */
export class AutoBidService {
  private isActive: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private signer: ethers.Signer | null = null;
  private currentAuctionId: number = 0;
  private maxBidAmount: number = 0;
  private walletAddress: string = "";
  private strategy: string = "balanced";
  
  /**
   * Start auto-bidding service 
   */
  public startAutoBidding(
    signer: ethers.Signer,
    auctionId: number,
    maxBidAmount: number,
    walletAddress: string,
    strategy: string = "balanced"
  ): void {
    this.isActive = true;
    this.signer = signer;
    this.currentAuctionId = auctionId;
    this.maxBidAmount = maxBidAmount;
    this.walletAddress = walletAddress;
    this.strategy = strategy;
    
    // Clear existing interval if any
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Set up bidding interval (check every 3 seconds)
    this.interval = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        // Get current auction status
        const provider = this.signer?.provider as ethers.Provider;
        if (!provider) return;
        
        // Fix: Create contract with proper typing
        const auctionContract = new ethers.Contract(
          AUCTION_CONTRACT_ADDRESS,
          AUCTION_CONTRACT_ABI,
          provider
        );
        
        // Connect the signer
        const connectedContract = auctionContract.connect(this.signer as ethers.Signer) as ethers.Contract & {
          getCurrentAuction: () => Promise<[bigint, string, bigint, any, boolean]>,
          placeBid: (auctionId: number, options: {value: bigint}) => Promise<ethers.ContractTransaction>
        };
        
        try {
          // Get current auction details using properly typed contract
          const [auctionId, highestBidder, highestBid, , isActive] = await connectedContract.getCurrentAuction();
          
          // Only place a bid if we're not the highest bidder and the bid is within our max
          if (
            highestBidder.toLowerCase() !== this.walletAddress.toLowerCase() && 
            parseFloat(ethers.formatEther(highestBid)) < this.maxBidAmount &&
            isActive
          ) {
            // Calculate bid increment based on strategy
            const bidIncrementPercentage = 
              this.strategy === "aggressive" ? 0.05 : 
              this.strategy === "conservative" ? 0.02 : 0.03; // 5%, 2% or default 3%
            
            const newBidAmount = parseFloat(ethers.formatEther(highestBid)) * (1 + bidIncrementPercentage);
            
            // Check if the new bid is within our max limit
            if (newBidAmount <= this.maxBidAmount) {
              const bidAmountWei = ethers.parseEther(newBidAmount.toFixed(18));
              
              console.log(`AutoBidService placing bid: ${newBidAmount} ETH`);
              // Convert the bigint auctionId to a number before passing it to placeBid
              await connectedContract.placeBid(Number(auctionId), { value: bidAmountWei });
            }
          }
        } catch (error) {
          console.error("Error accessing contract methods:", error);
        }
      } catch (error) {
        console.error("Error in auto-bidding process:", error);
      }
    }, 3000); // Check every 3 seconds
  }
  
  /**
   * Stop auto-bidding
   */
  public stopAutoBidding(): void {
    this.isActive = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log("Auto-bidding stopped");
  }
  
  /**
   * Update the maximum bid amount
   */
  public updateMaxBidAmount(newMaxAmount: number): void {
    this.maxBidAmount = newMaxAmount;
    console.log(`Max bid amount updated to ${newMaxAmount} ETH`);
  }
  
  /**
   * Check if auto-bidding is currently active
   */
  public isAutoBiddingActive(): boolean {
    return this.isActive;
  }
}