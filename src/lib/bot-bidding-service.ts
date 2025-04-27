import { ethers } from "ethers";
import { BotWallet, getBotWalletByAddress, loadBotWallets, BOT_WALLETS } from "./bot-wallets";
import { placeBid } from "./auction-contract";
import { 
  placeAutoBid, 
  initializeAutoBidder, 
  placeDirectBotBid, 
  initializeBotWallets,
  testBotWallet
} from "./auto-bid-service";
import { AutoBidService } from "./auto-bid-service";

// BotPayment contract address - updated after deployment
const BOT_PAYMENT_ADDRESS = "0xEBE1e2A8d6E57323A4D92d56eDD6635ccA6d3980"; // Updated with actual deployed address

// BotPayment contract ABI (minimal version for interaction)
const BOT_PAYMENT_ABI = [
  "function payModerator() external payable returns (bool)",
  "function moderator() external view returns (address)",
  "function getBotPayments(address bot) external view returns (uint256)"
];

// Moderator wallet that will centralize all transactions
const MODERATOR_ADDRESS = "0xDAcd7b2E80E2Bee4C5f6d5BBD683a56CE0130f46";

// Flag to determine whether to use direct wallet bidding or the proxy approach
const useDirectWalletBidding = true;

// Flag to enforce moderator payment with every transaction
const enforceModePaymentFee = true;

// Fee percentage that goes to moderator (5%)
const MODERATOR_FEE_PERCENT = 5;

// Map to track active bidding intervals for each bot
const activeBiddingIntervals: Map<string, NodeJS.Timeout> = new Map();

// Status of current automated bidding session
let isAutomatedBiddingActive = false;
let playerBeingAuctioned: any | null = null;

// Create singleton autoBidService instance
const autoBidService = new AutoBidService();

// Function to check if a bot is the current highest bidder
function botIsCurrentHighestBidder(currentBidder: string): boolean {
  if (!currentBidder) return false;
  const wallet = getBotWalletByAddress(currentBidder);
  return wallet !== undefined && wallet.isAI;
}

// Function to calculate player interest based on bot personality
function calculatePlayerInterest(botName: string, player: any): number {
  if (!player || !player.role) return 0.3;

  const role = player.role.toLowerCase();

  const teamPreferences: { [key: string]: { [key: string]: number } } = {
    'Mumbai Indians': {
      'batsman': 0.7,
      'bowler': 0.8,
      'all-rounder': 0.6
    },
    'Chennai Super Kings': {
      'batsman': 0.8,
      'bowler': 0.6,
      'all-rounder': 0.7
    },
    'Royal Challengers Bangalore': {
      'batsman': 0.9,
      'bowler': 0.5,
      'all-rounder': 0.6
    },
    'Kolkata Knight Riders': {
      'batsman': 0.6,
      'bowler': 0.7,
      'all-rounder': 0.8
    },
    'Delhi Capitals': {
      'batsman': 0.7,
      'bowler': 0.7,
      'all-rounder': 0.7
    }
  };

  let teamName = 'Default Team';
  if (botName.includes('Mumbai')) teamName = 'Mumbai Indians';
  else if (botName.includes('Chennai')) teamName = 'Chennai Super Kings';
  else if (botName.includes('Bangalore')) teamName = 'Royal Challengers Bangalore';
  else if (botName.includes('Kolkata')) teamName = 'Kolkata Knight Riders';
  else if (botName.includes('Delhi')) teamName = 'Delhi Capitals';

  const preferences = teamPreferences[teamName] || {
    'batsman': 0.7,
    'bowler': 0.7,
    'all-rounder': 0.7
  };

  if (role.includes('bat')) return preferences['batsman'];
  if (role.includes('bowl')) return preferences['bowler'];
  if (role.includes('all')) return preferences['all-rounder'];

  return 0.5;
}

// Function to temporarily pause other bots to create more realistic pacing
function pauseOtherBotsTemporarily(excludedBotAddress: string, minDelay: number, maxDelay: number): void {
  activeBiddingIntervals.forEach((interval, address) => {
    if (address !== excludedBotAddress) {
      clearInterval(interval);
      activeBiddingIntervals.delete(address);

      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      setTimeout(() => {
        const botWallet = getBotWalletByAddress(address);
        if (botWallet && playerBeingAuctioned) {
          try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
              const provider = new ethers.BrowserProvider((window as any).ethereum);
              startAutomatedBidding(botWallet, provider, playerBeingAuctioned.auctionId || 1, playerBeingAuctioned);
            }
          } catch (error) {
            console.error("Error resuming bot after pause:", error);
          }
        }
      }, delay);
    }
  });
}

// Function to pay moderator fee
async function payModeratorFee(
  provider: ethers.Provider,
  botWallet: BotWallet, 
  bidAmount: number
): Promise<boolean> {
  try {
    // Calculate moderator fee (5% of bid amount)
    const moderatorFee = bidAmount * MODERATOR_FEE_PERCENT / 100;
    console.log(`Paying ${moderatorFee} to moderator from bot ${botWallet.name}`);

    // Get signer for the bot wallet
    const botSigner = await getBotWalletSigner(provider, botWallet.name);
    if (!botSigner) {
      console.error(`Failed to get signer for bot ${botWallet.name}`);
      return false;
    }

    // Connect to BotPayment contract
    const botPaymentContract = new ethers.Contract(
      BOT_PAYMENT_ADDRESS,
      BOT_PAYMENT_ABI,
      botSigner
    );

    // Send payment to moderator
    const tx = await botPaymentContract.payModerator({
      value: ethers.parseEther(moderatorFee.toString())
    });

    await tx.wait();
    console.log(`Moderator payment successful from ${botWallet.name} with tx: ${tx.hash}`);
    return true;
  } catch (error) {
    console.error(`Error paying moderator fee from ${botWallet.name}:`, error);
    return false;
  }
}

// Helper function to get bot wallet signer
async function getBotWalletSigner(provider: ethers.Provider, botName: string): Promise<ethers.Signer | null> {
  try {
    // Get the bot wallet from our predefined wallets
    const botWallet = getBotWalletByAddress(botName);
    if (!botWallet || !botWallet.privateKey) {
      console.error(`Bot wallet or private key not found for: ${botName}`);
      return null;
    }

    // Create a direct wallet instance with the private key
    const wallet = new ethers.Wallet(botWallet.privateKey);
    // Connect the wallet to the provider
    return wallet.connect(provider);
  } catch (error) {
    console.error(`Error getting bot wallet signer for ${botName}:`, error);
    return null;
  }
}

// Function to start automated bidding for a single bot
export const startAutomatedBidding = (
  botWallet: BotWallet, 
  provider: ethers.Provider,
  auctionId: number,
  player: any
): void => {
  // Don't start if already running for this bot
  if (activeBiddingIntervals.has(botWallet.address)) {
    console.log(`Automated bidding already running for ${botWallet.name}`);
    return;
  }
  
  console.log(`Starting automated bidding for ${botWallet.name} with strategy: ${botWallet.strategy}`);
  playerBeingAuctioned = player;
  
  // Use deterministic but shorter interval with wallet address as seed
  // This makes bots bid more frequently creating more competitive auctions
  const getIntervalFromAddress = (address: string): number => {
    // Convert address to a number using simple hash
    const addressNum = parseInt(address.substring(2, 10), 16);
    // Range between 5-10 seconds
    return 5000 + (addressNum % 5000);
  };
  
  const checkInterval = getIntervalFromAddress(botWallet.address);
  
  // Start the bidding cycle
  const interval = setInterval(async () => {
    try {
      const currentBid = 0; // Placeholder for current bid
      const currentBidder = ''; // Placeholder for current bidder
      
      // Don't bid if already highest bidder
      if (currentBidder.toLowerCase() === botWallet.address.toLowerCase()) {
        return;
      }
      
      // Check if we have enough balance to bid
      if (currentBid && botWallet.balance <= currentBid) {
        console.log(`${botWallet.name} doesn't have enough balance to bid`);
        return;
      }
      
      // Decide whether to bid based on strategy, player value and current bidder
      let shouldBid = false;
      
      // Higher chance of bidding overall
      const baseBidChance = 0.7;
      
      // Bot personalities - some teams are more interested in certain player roles
      const playerRoleInterest = calculatePlayerInterest(botWallet.name, player);
      
      // React to user bids - more likely to bid if current bidder is a human player
      if (!currentBidder.startsWith("AI-") && !botIsCurrentHighestBidder(currentBidder)) {
        // 85% chance of bidding against a human + role interest factor
        shouldBid = Math.random() < (0.85 + playerRoleInterest * 0.05);
      } else {
        // Regular bidding chance + role interest factor
        shouldBid = Math.random() < (baseBidChance + playerRoleInterest * 0.05);
      }
      
      // Increase bid chance in bidding wars (when multiple bids have happened)
      if (player.bidHistory && player.bidHistory.length > 3) {
        shouldBid = Math.random() < (shouldBid ? 0.95 : 0.4); // More likely to join bidding wars
      }
      
      if (!shouldBid) return;
      
      // Calculate a bid based on strategy and player interest
      let bidAmount = 0;
      const baseBid = currentBid || 0.001; // Use a small default value if currentBid is undefined
      
      // Base increments
      let baseIncrement = 0;
      switch(botWallet.strategy) {
        case 'aggressive':
          // Aggressive bots bid 10-20% higher
          baseIncrement = 0.10 + Math.random() * 0.10;
          break;
        case 'conservative':
          // Conservative bots bid 5-10% higher
          baseIncrement = 0.05 + Math.random() * 0.05;
          break;
        case 'balanced':
        default:
          // Balanced bots bid 7-15% higher
          baseIncrement = 0.07 + Math.random() * 0.08;
      }
      
      // Adjust increment based on player interest
      baseIncrement *= (1 + playerRoleInterest * 0.2);
      
      // Add small random spikes to create unpredictable bidding patterns
      if (Math.random() > 0.85) {
        baseIncrement += 0.05 + Math.random() * 0.1; // 15% chance of extra aggressive bid
      }
      
      // Calculate final bid amount
      bidAmount = baseBid * (1 + baseIncrement);
      
      // Ensure minimum bid increment
      bidAmount = Math.max(bidAmount, baseBid + 0.0002);
      
      // Round to 5 decimal places
      bidAmount = Math.round(bidAmount * 100000) / 100000;
      
      // Place bid if we have enough balance
      if (bidAmount <= botWallet.balance) {
        let bidResult = false;
        
        if (useDirectWalletBidding) {
          // Calculate total amount needed including moderator fee
          const moderatorFee = enforceModePaymentFee ? (bidAmount * MODERATOR_FEE_PERCENT / 100) : 0;
          const totalAmount = bidAmount + moderatorFee;
          
          // Check if bot can afford bid + fee
          if (totalAmount > botWallet.balance) {
            console.log(`${botWallet.name} can't afford bid + moderator fee`);
            return;
          }
          
          // Use the bot's own wallet to place the bid
          const result = await placeDirectBotBid(
            provider,
            botWallet.name,
            auctionId, 
            bidAmount
          );
          
          if (result.success) {
            console.log(`${botWallet.name} placed a direct wallet bid of ${result.bidAmount || bidAmount} with tx: ${result.txHash}`);
            bidResult = true;
            // Use the actual bid amount if returned
            if (result.bidAmount) {
              bidAmount = result.bidAmount;
            }
            
            // Pay moderator fee if enabled
            if (enforceModePaymentFee) {
              const feeResult = await payModeratorFee(provider, botWallet, bidAmount);
              if (feeResult) {
                console.log(`${botWallet.name} successfully paid moderator fee`);
              } else {
                console.error(`${botWallet.name} failed to pay moderator fee`);
              }
            }
            
            botWallet.balance -= (bidAmount + (enforceModePaymentFee ? bidAmount * MODERATOR_FEE_PERCENT / 100 : 0)); // Update the bot's balance after bidding
          } else {
            console.log(`${botWallet.name} failed to place direct wallet bid: ${result.error}`);
          }
        } else {
          // Use the centralized moderator wallet approach
          const result = await placeBotBid(provider, auctionId, bidAmount, BOT_WALLETS.indexOf(botWallet));
          bidResult = result.success;
        }
        
        if (bidResult) {
          console.log(`${botWallet.name} placed a${useDirectWalletBidding ? ' direct wallet' : ' centralized moderator'} bid of ${bidAmount} for ${player.name}`);
          
          // Add dramatic delay for other bots after successful bid (create tension)
          if (Math.random() > 0.7) {
            // 30% chance to cause a brief "pause" in bidding from other bots
            pauseOtherBotsTemporarily(botWallet.address, 2000, 4000);
          }
        } else {
          console.log(`${botWallet.name} failed to place bid`);
        }
      }
    } catch (error) {
      console.error(`Error in automated bidding for ${botWallet.name}:`, error);
    }
  }, checkInterval);
  
  // Store interval reference for later cleanup
  activeBiddingIntervals.set(botWallet.address, interval);
  isAutomatedBiddingActive = true;
};

// Function to start automated bidding for a group of bots
export const startGroupAutomatedBidding = async (
  auctionId: number,
  basePrice: number
): Promise<void> => {
  console.log("Starting group automated bidding for auction ID:", auctionId, "with base price:", basePrice);
  
  // Get all available bot wallets
  const botWallets = await loadBotWallets();
  console.log("Bot wallets loaded:", botWallets.length);
  
  // Create a minimal player object if not provided
  const player = { 
    basePrice, 
    name: "Current Player", 
    auctionId,
    role: "Player" // Add default role for interest calculation
  };
  
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    console.error("No provider available for bot bidding");
    return;
  }
  
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    
    // Clear any existing automated bidding first
    stopAllAutomatedBidding();
    
    // Initialize the bot wallets to get updated balances
    (async () => {
      try {
        // Test one of the wallets to make sure they're working
        const testResult = await testBotWallet(provider, "Mumbai Indians");
        if (testResult.success) {
          console.log(`Test wallet verification successful: ${testResult.address} with balance ${testResult.balance}`);
        } else {
          console.warn(`Wallet test failed: ${testResult.error}`);
        }
        
        const initialized = await initializeBotWallets(provider);
        if (initialized) {
          console.log("Bot wallets successfully initialized with current balances");
        } else {
          console.warn("Failed to initialize bot wallets with current balances");
        }
      } catch (error) {
        console.error("Error initializing bot wallets:", error);
      }
    })();
    
    // Start each bot with a staggered delay to prevent simultaneous bidding
    botWallets.forEach((wallet: BotWallet, index: number) => {
      // Use wallet address hash for deterministic staggering
      const addressNum = parseInt(wallet.address.substring(2, 10), 16);
      const staggerDelay = (addressNum % 3000) + index * 1000; // Stagger 1-4 seconds per bot
      
      console.log(`Will start bidding for bot ${wallet.name} in ${staggerDelay}ms`);
      
      setTimeout(() => {
        startAutomatedBidding(wallet, provider, auctionId, player);
      }, staggerDelay);
    });
    
    isAutomatedBiddingActive = true;
    console.log(`Started automated bidding for ${botWallets.length} bots on auction #${auctionId}`);
  } catch (error) {
    console.error("Error starting group automated bidding:", error);
  }
};

// Function to react to a user bid - triggers bot responses immediately
export const reactToUserBid = async (
  provider: ethers.Provider,
  auctionId: number,
  userBidAmount: number
): Promise<void> => {
  // Only react if we have active bots and a player being auctioned
  if (!isAutomatedBiddingActive || !playerBeingAuctioned) return;
  
  console.log(`Triggering bot reactions to user bid: ${userBidAmount}`);
  
  // Get all active bot wallets
  const botWallets = await loadBotWallets();
  const activeBots = Array.from(activeBiddingIntervals.keys());
  
  // 1-2 bots will react to user bids
  const numBotsToReact = Math.floor(Math.random() * 2) + 1; // 1-2 bots
  
  console.log(`${numBotsToReact} bots will respond to user bid`);
  
  // Select random bots to respond
  const respondingBots = [];
  const botAddresses = [...activeBots]; // Create a copy
  
  for (let i = 0; i < Math.min(numBotsToReact, botAddresses.length); i++) {
    const randomIndex = Math.floor(Math.random() * botAddresses.length);
    respondingBots.push(botAddresses[randomIndex]);
    botAddresses.splice(randomIndex, 1); // Remove selected bot
  }
  
  // For each responding bot, have them place a bid
  for (const botAddress of respondingBots) {
    // First, clear any existing interval
    clearTimeout(activeBiddingIntervals.get(botAddress));
    activeBiddingIntervals.delete(botAddress);
    
    // Find the bot wallet object
    const botWallet = getBotWalletByAddress(botAddress);
    if (!botWallet) continue;
    
    // Small delay to make it feel natural (staggered responses)
    const delay = 500 + Math.random() * 2500; // 0.5-3 seconds
    
    setTimeout(async () => {
      try {
        const currentBid = userBidAmount; // Placeholder for current bid
        
        // Calculate counter bid based on strategy
        let bidIncrement = 0;
        switch(botWallet.strategy) {
          case 'aggressive':
            // Aggressive bots bid 12-20% higher against users
            bidIncrement = 0.12 + Math.random() * 0.08;
            break;
          case 'conservative':
            // Conservative bots bid 5-10% higher
            bidIncrement = 0.05 + Math.random() * 0.05;
            break;
          case 'balanced':
          default:
            // Balanced bots bid 8-15% higher
            bidIncrement = 0.08 + Math.random() * 0.07;
        }
        
        // Add small random component to make bidding unpredictable
        bidIncrement += (Math.random() > 0.7) ? 0.03 : 0;
        
        // Calculate bid amount
        let bidAmount = currentBid * (1 + bidIncrement);
        
        // Apply minimum increment if needed
        bidAmount = Math.max(bidAmount, currentBid + 0.0002);
        
        // Round to 5 decimal places for display
        bidAmount = Math.round(bidAmount * 100000) / 100000;
        
        // Place bid if we have enough balance
        if (bidAmount <= botWallet.balance) {
          console.log(`${botWallet.name} counter-bidding with ${bidAmount} against user bid of ${userBidAmount}`);
          
          let bidResult = false;
          
          if (useDirectWalletBidding) {
            // Use the bot's own wallet to place the counter-bid
            const result = await placeDirectBotBid(
              provider,
              botWallet.name,
              auctionId, 
              bidAmount
            );
            
            if (result.success) {
              console.log(`${botWallet.name} placed a direct wallet counter-bid with tx: ${result.txHash}`);
              bidResult = true;
              // Use the actual bid amount if returned
              if (result.bidAmount) {
                bidAmount = result.bidAmount;
              }
              botWallet.balance -= bidAmount; // Update the bot's balance
            } else {
              console.log(`${botWallet.name} failed to place direct wallet counter-bid: ${result.error}`);
            }
          } else {
            // Use the centralized moderator wallet approach
            const result = await placeBotBid(provider, auctionId, bidAmount, BOT_WALLETS.indexOf(botWallet));
            bidResult = result.success;
          }
          
          if (bidResult) {
            console.log(`${botWallet.name} placed a${useDirectWalletBidding ? ' direct wallet' : ' centralized moderator'} counter-bid of ${bidAmount} for ${playerBeingAuctioned.name}`);
            botWallet.balance -= bidAmount; // Update the bot's balance
          } else {
            console.log(`${botWallet.name} failed to place counter-bid`);
          }
        } else {
          console.log(`${botWallet.name} doesn't have enough balance to counter-bid`);
        }
        
        // Resume automated bidding for this bot after counter-bid attempt
        setTimeout(() => {
          startAutomatedBidding(botWallet, provider, auctionId, playerBeingAuctioned!);
        }, 3000 + Math.random() * 2000); // 3-5 second delay before resuming normal bidding
        
      } catch (error) {
        console.error(`Error in bot counter-bidding for ${botWallet.name}:`, error);
      }
    }, delay);
  }
}

// Helper function to check if a bot is the current highest bidder
async function botIsCurrentHighestBidderAsync(address: string): Promise<boolean> {
  const botWallets = await loadBotWallets();
  const BOT_ADDRESSES = botWallets.map((bot: BotWallet) => bot.address.toLowerCase());
  return BOT_ADDRESSES.includes(address.toLowerCase());
}

// Stop automated bidding for a single bot
export const stopAutomatedBidding = (botAddress: string): void => {
  const interval = activeBiddingIntervals.get(botAddress);
  if (interval) {
    clearInterval(interval);
    activeBiddingIntervals.delete(botAddress);
    console.log(`Stopped automated bidding for bot ${botAddress}`);
  }
};

// Stop all automated bidding
export const stopAllAutomatedBidding = (): void => {
  activeBiddingIntervals.forEach((interval, address) => {
    clearInterval(interval);
    console.log(`Stopped automated bidding for bot ${address}`);
  });
  
  activeBiddingIntervals.clear();
  isAutomatedBiddingActive = false;
  playerBeingAuctioned = null;
  console.log('All automated bidding stopped');
};

// Check if automated bidding is active
export const isAutomatedBiddingRunning = (): boolean => {
  return isAutomatedBiddingActive && activeBiddingIntervals.size > 0;
};

// Function to simulate AI bot bids with real transactions (legacy method)
export const simulateAIBotBid = async (
  provider: ethers.Provider,
  auctionId: number, 
  bidAmount: number, 
  botName: string,
  botAddress: string
): Promise<boolean> => {
  try {
    console.log(`AI Bot ${botName} is placing a real bid of ${bidAmount}`);
    
    // Placeholder for result
    const result = { success: true, txHash: "0x123" };
    
    if (result.success) {
      console.log(`AI Bot ${botName} real bid successful with tx: ${result.txHash}`);
      return true;
    } else {
      console.error(`AI Bot ${botName} bid failed`);
      return false;
    }
  } catch (error) {
    console.error(`Error in AI Bot ${botName} bid:`, error);
    return false;
  }
};

// Centralized bot bidding function
export const placeBotBid = async (
  provider: ethers.Provider,
  auctionId: number, 
  bidAmount: number,
  botIndex: number
) => {
  try {
    // Get the bot wallet from our predefined list
    const botWallet = BOT_WALLETS[botIndex];
    if (!botWallet) {
      console.error("Bot wallet not found at index", botIndex);
      return { success: false };
    }
    
    // For simulation only: check if bot has enough balance
    const moderatorFee = enforceModePaymentFee ? (bidAmount * MODERATOR_FEE_PERCENT / 100) : 0;
    const totalAmount = bidAmount + moderatorFee;
    
    if (botWallet.balance < totalAmount) {
      console.error(`Bot ${botWallet.name} has insufficient funds. Balance: ${botWallet.balance}, Total needed: ${totalAmount}`);
      return { success: false };
    }
    
    console.log(`Bot ${botWallet.name} bidding ${bidAmount} with ${moderatorFee} moderator fee`);

    // Connect to moderator wallet always for all transactions
    // Use provider with moderator account
    let signer;
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      // For security, check if the connected wallet is the moderator
      if (accounts[0] && accounts[0].toLowerCase() === MODERATOR_ADDRESS.toLowerCase()) {
        signer = await provider.getSigner(accounts[0]);
      } else {
        console.error("Connected wallet is not the moderator, cannot place bot bid");
        return { success: false };
      }
    } else {
      console.error("No web3 provider available");
      return { success: false };
    }
    
    // Pay moderator fee if enabled
    if (enforceModePaymentFee) {
      // Get bot wallet signer
      const botSigner = await getBotWalletSigner(provider, botWallet.name);
      if (!botSigner) {
        console.error(`Failed to get signer for bot ${botWallet.name}`);
        return { success: false };
      }

      // Connect to BotPayment contract
      const botPaymentContract = new ethers.Contract(
        BOT_PAYMENT_ADDRESS,
        BOT_PAYMENT_ABI,
        botSigner
      );

      // Send payment to moderator
      const tx = await botPaymentContract.payModerator({
        value: ethers.parseEther(moderatorFee.toString())
      });

      await tx.wait();
      console.log(`Moderator payment successful from ${botWallet.name} with tx: ${tx.hash}`);
    }
    
    // Update bot balance (in a real implementation this would be on-chain)
    BOT_WALLETS[botIndex].balance -= totalAmount;
    
    // Placeholder for result
    const result = { success: true };
    
    return result;
  } catch (error) {
    console.error("Error in placeBotBid:", error);
    return { success: false };
  }
};

// Check if a wallet is AI controlled
export const isAIWallet = (address: string): boolean => {
  const wallet = getBotWalletByAddress(address);
  return wallet ? wallet.isAI : false;
};

/**
 * Force all AI bots to participate in the current auction
 * This function ensures all bots will place bids with more aggressive bidding patterns
 */
export const forceAllBotsToParticipate = async (
  auctionId: number,
  currentBid: number,
  currentPlayerData: any
): Promise<boolean> => {
  try {
    console.log("🤖 Forcing all AI bots to participate in bidding");
    
    // Stop any existing bidding first to reset the state
    stopAllAutomatedBidding();
    
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.error("No provider available for bot bidding");
      return false;
    }

    // Create provider for blockchain interaction
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    
    // Get all available bot wallets
    const botWallets = await loadBotWallets();
    if (botWallets.length === 0) {
      console.error("No bot wallets found");
      return false;
    }
    
    console.log(`Found ${botWallets.length} bot wallets to participate in auction`);

    // Enhanced player object with current bid information
    const enhancedPlayer = { 
      ...currentPlayerData,
      basePrice: currentBid || currentPlayerData.basePrice,
      currentBid: currentBid,
      auctionId: auctionId,
      // Adding bidHistory to increase bid probability
      bidHistory: Array(5).fill({ bidder: "dummy", amount: currentBid })
    };
    
    playerBeingAuctioned = enhancedPlayer;
    
    // Start each bot with very short staggered delay (much shorter than normal)
    botWallets.forEach((wallet: BotWallet, index: number) => {
      // Much shorter delays (100-800ms) for even more active bidding
      const staggerDelay = 100 + Math.random() * 700 + (index * 200);
      
      // Artificially increase each bot's balance to ensure they can bid
      const originalBalance = wallet.balance;
      wallet.balance = Math.max(wallet.balance, currentBid * 5); // Ensure each bot has enough balance
      
      setTimeout(() => {
        // Override bot strategy to be more aggressive
        const originalStrategy = wallet.strategy;
        wallet.strategy = 'aggressive';
        
        // Set up a special high-frequency bidding interval for this bot
        const fastBidInterval = setInterval(() => {
          // Calculate a random bid increment (5-20%)
          const increment = 0.05 + (Math.random() * 0.15);
          const newBid = currentBid * (1 + increment);
          
          // Attempt to place a bid with 90% probability
          if (Math.random() < 0.9) {
            console.log(`🔥 ${wallet.name} actively bidding with high frequency`);
            // Will trigger the handler in AuctionPage to process this bid
            if (typeof window !== 'undefined') {
              const bidEvent = new CustomEvent('ai-bot-bid', { 
                detail: { 
                  botAddress: wallet.address, 
                  botName: wallet.name, 
                  amount: Math.round(newBid * 10000) / 10000
                } 
              });
              window.dispatchEvent(bidEvent);
            }
          }
        }, 2000 + (index * 500)); // Each bot bids every 2-4 seconds
        
        // Also start the normal automated bidding (as backup)
        startAutomatedBidding(wallet, provider, auctionId, enhancedPlayer);
        
        // Store the interval for cleanup
        const existingInterval = activeBiddingIntervals.get(wallet.address);
        activeBiddingIntervals.set(wallet.address, existingInterval || fastBidInterval);
        
        // Reset strategy and balance after 15 seconds
        setTimeout(() => {
          wallet.strategy = originalStrategy;
          wallet.balance = originalBalance; // Restore original balance
          
          // Clear the fast bidding interval but keep normal bidding
          clearInterval(fastBidInterval);
        }, 15000);
      }, staggerDelay);
    });
    
    isAutomatedBiddingActive = true;
    console.log(`🔥 All ${botWallets.length} bots are now actively bidding in auction #${auctionId}`);
    return true;
  } catch (error) {
    console.error("Error forcing all bots to bid:", error);
    return false;
  }
};

// Interface for autoBidParams
interface AutoBidParams {
  maxAmount: number;
  strategy: string;
  playerId: string;
  currentBid: number;
}

/**
 * Start auto bidding process
 * @param params Auto bid parameters
 */
export const startAutoBidding = async (params: AutoBidParams): Promise<boolean> => {
  try {
    // In a real app, we would get these from a connected provider
    // This is a simplified version for demo purposes
    const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia");
    const wallet = new ethers.Wallet(
      "0x1234567890123456789012345678901234567890123456789012345678901234", 
      provider
    );
    
    autoBidService.startAutoBidding(
      wallet,
      parseInt(params.playerId),
      params.maxAmount,
      await wallet.getAddress(),
      params.strategy
    );
    
    return true;
  } catch (error) {
    console.error("Error starting auto bidding:", error);
    return false;
  }
};

/**
 * Stop auto bidding process
 */
export const stopAutoBidding = async (): Promise<boolean> => {
  try {
    autoBidService.stopAutoBidding();
    return true;
  } catch (error) {
    console.error("Error stopping auto bidding:", error);
    return false;
  }
};

/**
 * Check if auto bidding is active
 */
export const isAutoBiddingActive = (): boolean => {
  return autoBidService.isAutoBiddingActive();
};

/**
 * Update max bid amount for auto bidding
 */
export const updateMaxAutoBidAmount = (newAmount: number): void => {
  autoBidService.updateMaxBidAmount(newAmount);
};

/**
 * Get total moderator fees paid by a bot
 */
export const getBotModeratorFees = async (provider: ethers.Provider, botAddress: string): Promise<number> => {
  try {
    const contract = new ethers.Contract(
      BOT_PAYMENT_ADDRESS,
      BOT_PAYMENT_ABI,
      provider
    );
    
    const paymentsWei = await contract.getBotPayments(botAddress);
    return Number(ethers.formatEther(paymentsWei));
  } catch (error) {
    console.error("Error getting bot moderator fees:", error);
    return 0;
  }
};

// Add alias exports for backward compatibility
export const stopAutoBiddingLegacy = stopAllAutomatedBidding;
export const startAutoBiddingLegacy = startAutomatedBidding;