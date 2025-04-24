import { ethers } from "ethers";
import { formatMonadAmount } from "./monad-utils";

/**
 * Wallet interface for teams, users and moderator
 */
export interface Wallet {
  /**
   * Wallet name (team or role)
   */
  name: string;
  /**
   * Ethereum address
   */
  address: string;
  /**
   * Private key (only used in dev/test environments)
   */
  privateKey?: string;
  /**
   * Type of wallet owner (team, user, or moderator)
   */
  type: 'team' | 'user' | 'moderator';
  /**
   * Team ID if type is team
   */
  teamId?: string;
  /**
   * Current wallet balance (always defined as a number)
   */
  balance: number;
  /**
   * Is this wallet controlled by AI?
   */
  isAI: boolean;
  /**
   * Bidding strategy for AI bots
   */
  strategy?: 'aggressive' | 'balanced' | 'conservative';
}

// Define the bot wallets - only 4 teams, 1 user, and 1 moderator wallet with unique addresses
export const BOT_WALLETS: Wallet[] = [
  {
    name: "Mumbai Indians",
    address: "0xDAcd7b2E80E2Bee4C5f6d5BBD683a56CE0130f46", // Main Account
    privateKey: "52243a21684d53f5b1f82c10c729a3454868b7108f63d7a0b51fef9af00e8ab9",
    type: "team",
    teamId: "mi",
    isAI: true,
    balance: 100,
    strategy: "aggressive"
  },
  {
    name: "Chennai Super Kings",
    address: "0xAAF95F79CAE722E2886C25897A0fD468298A5FAD", // Account 1
    privateKey: "b34a6d264a39ffa9a59507d4d7595575e4ea02e3cd5912826b3c07ab4f632797",
    type: "team",
    teamId: "csk",
    isAI: true,
    balance: 100,
    strategy: "balanced"
  },
  {
    name: "Royal Challengers Bangalore",
    address: "0x59b709dC04Fd759A11E3ca803CaD7b96785A2464", // Account 2
    privateKey: "4af989f74c4ac52576fedd2600ed4739ff2c276211d01aecf290d984ddfc206a",
    type: "team",
    teamId: "rcb",
    isAI: true,
    balance: 100,
    strategy: "aggressive"
  },
  {
    name: "Kolkata Knight Riders",
    address: "0x6FBE3F533150214f9C9236E35C0e3cB9648968fE", // Account 3
    privateKey: "7922f84a364ec4cba31badd244721c1630f455588762c71babfb712892144901",
    type: "team",
    teamId: "kkr",
    isAI: true,
    balance: 100,
    strategy: "conservative"
  },
  {
    name: "User",
    address: "0x75bEc93C32E43455acBb626B5DeF4094cA4F9F67", // Account 4
    privateKey: "1fda284f1de56c147f9350934c2b1ec87bfdca89a0e7389ec1159e32b4e82e14",
    type: "user",
    isAI: false,
    balance: 100
  },
  {
    name: "AI Moderator",
    address: "0xDAcd7b2E80E2Bee4C5f6d5BBD683a56CE0130f46", // Updated to match the address used in other files
    privateKey: "4752894e50e69ffdba2f1788122ff5c148fc42b9236b379bbbfcd53bc88af06b", // Private key from .env
    type: "moderator",
    isAI: true,
    balance: 100
  }
];

// Export the moderator address for use in other modules
export const MODERATOR_ADDRESS = BOT_WALLETS.find(wallet => wallet.type === 'moderator')!.address;

// Export user address for easier access
export const USER_ADDRESS = BOT_WALLETS.find(wallet => wallet.type === 'user')!.address;

/**
 * Get a bot wallet by address
 * @param address The wallet address to look up
 * @returns The corresponding wallet or undefined if not found
 */
export const getBotWalletByAddress = (address: string): Wallet | undefined => {
  if (!address) return undefined;
  return BOT_WALLETS.find(wallet => 
    wallet.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * Get a bot wallet by name
 * @param name The wallet name to look up
 * @returns The corresponding wallet or undefined if not found
 */
export const getBotWalletByName = (name: string): Wallet | undefined => {
  if (!name) return undefined;
  return BOT_WALLETS.find(wallet => 
    wallet.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Get team wallet by team ID
 * @param teamId The team ID to look up 
 * @returns The corresponding wallet or undefined if not found
 */
export const getWalletByTeamId = (teamId: string): Wallet | undefined => {
  if (!teamId) return undefined;
  return BOT_WALLETS.find(wallet => 
    wallet.type === 'team' && wallet.teamId === teamId
  );
};

/**
 * Get the moderator wallet
 * @returns The moderator wallet
 */
export const getModeratorWallet = (): Wallet => {
  return BOT_WALLETS.find(wallet => wallet.type === 'moderator')!;
};

/**
 * Get the user wallet
 * @returns The user wallet
 */
export const getUserWallet = (): Wallet => {
  return BOT_WALLETS.find(wallet => wallet.type === 'user')!;
};

/**
 * Format address for display
 * @param address The Ethereum address to format
 * @returns Shortened address format
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  
  // Check if it's a known wallet address
  const wallet = getBotWalletByAddress(address);
  if (wallet) {
    if (wallet.type === 'team') {
      return wallet.name;
    } else if (wallet.type === 'user') {
      return 'You';
    } else if (wallet.type === 'moderator') {
      return 'AI Moderator';
    }
  }
  
  // For real addresses, shorten them
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Determine if a wallet is AI-controlled
 * @param address The wallet address to check
 * @returns True if the wallet is AI-controlled
 */
export const isAIWallet = (address: string): boolean => {
  const wallet = getBotWalletByAddress(address);
  return wallet ? wallet.isAI : false;
};

/**
 * Update wallet balances for all bot wallets
 * @param provider Ethereum provider to use for balance checks
 * @returns Promise that resolves when all balances are updated
 */
export const updateAllWalletBalances = async (provider: ethers.Provider): Promise<void> => {
  try {
    for (let i = 0; i < BOT_WALLETS.length; i++) {
      const wallet = BOT_WALLETS[i];
      try {
        const balance = await provider.getBalance(wallet.address);
        BOT_WALLETS[i].balance = parseFloat(formatMonadAmount(balance));
      } catch (error) {
        console.error(`Error fetching balance for ${wallet.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error updating wallet balances:", error);
  }
};

/**
 * Get wallet balances for all bot wallets
 * @param provider Ethereum provider to use for balance checks
 * @returns Promise that resolves to an array of wallets with balances
 */
export const getWalletBalances = async (provider: ethers.Provider): Promise<Wallet[]> => {
  await updateAllWalletBalances(provider);
  return [...BOT_WALLETS];
};

/**
 * Execute automatic transaction from an AI-controlled wallet to another wallet
 * This is used for AI bots to automatically send transactions
 * @param provider Ethereum provider
 * @param fromTeamId The team ID to send from
 * @param toAddress The address to send to
 * @param amount Amount to send (in MONAD)
 * @returns Promise that resolves to transaction info
 */
export const executeAutomaticAITransaction = async (
  provider: ethers.Provider,
  fromTeamId: string,
  toAddress: string,
  amount: string
): Promise<{success: boolean, txHash?: string, error?: string}> => {
  try {
    const teamWallet = getWalletByTeamId(fromTeamId);
    
    if (!teamWallet || !teamWallet.privateKey) {
      return { success: false, error: `Team wallet not found or has no private key: ${fromTeamId}` };
    }
    
    if (!teamWallet.isAI) {
      return { success: false, error: `Cannot execute automatic transaction for non-AI wallet: ${teamWallet.name}` };
    }
    
    // Create wallet instance with private key
    const wallet = new ethers.Wallet(teamWallet.privateKey, provider);
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);
    
    // Send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`AI Bot ${teamWallet.name} automatically paid ${amount} MON to ${toAddress}. TX: ${tx.hash}`);
    
    // Update balances after transaction
    await updateAllWalletBalances(provider);
    
    return {
      success: true,
      txHash: receipt ? tx.hash : undefined
    };
    
  } catch (error: any) {
    console.error("Error executing automatic AI transaction:", error);
    return {
      success: false,
      error: error.message || "Unknown error during automatic payment"
    };
  }
};

/**
 * Create a schedule for AI to automatically pay the moderator
 * @param provider Ethereum provider
 * @param teamIds Array of team IDs that should pay
 * @param amount Amount to pay
 * @param intervalMinutes How often to pay (in minutes)
 */
export const scheduleAutomaticPayments = (
  provider: ethers.Provider,
  teamIds: string[],
  amount: string,
  intervalMinutes: number = 10
): NodeJS.Timeout => {
  console.log(`Setting up automatic payments of ${amount} MON every ${intervalMinutes} minutes`);
  
  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Create an interval to execute payments
  const intervalId = setInterval(async () => {
    console.log("Executing scheduled AI payments to moderator...");
    const moderator = getModeratorWallet();
    
    // Execute a payment for each AI team
    for (const teamId of teamIds) {
      try {
        const result = await executeAutomaticAITransaction(
          provider, 
          teamId, 
          moderator.address, 
          amount
        );
        
        if (result.success) {
          console.log(`Scheduled payment from ${teamId} to moderator successful`);
        } else {
          console.error(`Scheduled payment from ${teamId} to moderator failed:`, result.error);
        }
      } catch (error) {
        console.error(`Error in scheduled payment from ${teamId}:`, error);
      }
    }
  }, intervalMs);
  
  return intervalId;
};

/**
 * Smart contract interface for automating transactions
 * This is a simplified representation of the contract methods
 */
export interface BotPaymentContract {
  payModerator(amount: string): Promise<ethers.ContractTransactionResponse>;
  transferToModerator(): Promise<ethers.ContractTransactionResponse>;
  getBalance(address: string): Promise<bigint>;
}

/**
 * ABI for the BotPayment contract
 */
export const BOT_PAYMENT_CONTRACT_ABI = [
  "function payModerator(uint256 amount) external returns (bool)",
  "function transferToModerator() external returns (bool)",
  "function getBalance(address wallet) external view returns (uint256)",
  "event PaymentSent(address indexed from, address indexed to, uint256 amount, uint256 timestamp)"
];

/**
 * Create a BotPayment contract instance
 * @param provider Ethereum provider
 * @param contractAddress Address of the deployed BotPayment contract
 * @param signer Signer to use for transactions (optional)
 */
export const createBotPaymentContract = (
  provider: ethers.Provider,
  contractAddress: string,
  signer?: ethers.Signer
): ethers.Contract => {
  const contract = new ethers.Contract(
    contractAddress, 
    BOT_PAYMENT_CONTRACT_ABI,
    provider
  );
  
  if (signer) {
    return contract.connect(signer);
  }
  
  return contract;
};

/**
 * Create a signer for a bot wallet using its private key
 * @param provider Ethereum provider
 * @param walletAddressOrTeamId The address of the wallet or team ID
 * @returns A signer for the bot wallet or undefined if not found
 */
export const getBotSigner = (
  provider: ethers.Provider,
  walletAddressOrTeamId: string
): ethers.Wallet | undefined => {
  let wallet: Wallet | undefined;
  
  // Check if input is an address or team ID
  if (walletAddressOrTeamId.startsWith('0x')) {
    wallet = getBotWalletByAddress(walletAddressOrTeamId);
  } else {
    wallet = getWalletByTeamId(walletAddressOrTeamId);
  }
  
  if (!wallet || !wallet.privateKey) {
    console.error(`No wallet or private key found for: ${walletAddressOrTeamId}`);
    return undefined;
  }
  
  // Create and return a wallet connected to the provider
  try {
    return new ethers.Wallet(wallet.privateKey, provider);
  } catch (error) {
    console.error(`Error creating wallet signer: ${error}`);
    return undefined;
  }
};

/**
 * Load and initialize bot wallets - useful for initializing at application startup
 * @param provider Optional Ethereum provider to use for balance checks
 * @returns Promise that resolves to an array of wallets with balances
 */
export const loadBotWallets = async (provider?: ethers.Provider): Promise<Wallet[]> => {
  try {
    console.log("Loading and initializing bot wallets...");
    
    if (provider) {
      // Update balances if provider is available
      await updateAllWalletBalances(provider);
    }
    
    return [...BOT_WALLETS];
  } catch (error) {
    console.error("Error loading bot wallets:", error);
    return [...BOT_WALLETS]; // Return wallets without balances if there was an error
  }
};

/**
 * Get all bot wallets that are AI-controlled
 * @returns Array of all AI-controlled wallets
 */
export const getAllBotWallets = (): Wallet[] => {
  return BOT_WALLETS.filter(wallet => wallet.isAI && wallet.type === 'team');
};

/**
 * Get team information for a bot wallet
 * @param address The wallet address
 * @returns Team information object or null if not found
 */
export const getBotTeam = (address: string): {id: string, name: string} | null => {
  const wallet = getBotWalletByAddress(address);
  if (wallet && wallet.type === 'team' && wallet.teamId) {
    return {
      id: wallet.teamId,
      name: wallet.name
    };
  }
  return null;
};

/**
 * Check if a wallet is the moderator wallet
 * @param address The wallet address to check
 * @returns True if the wallet is the moderator
 */
export const isModeratorWallet = (address: string): boolean => {
  const wallet = getBotWalletByAddress(address);
  return wallet ? wallet.type === 'moderator' : false;
};

// Define a type for BotWallet for better code completion and type checking
export type BotWallet = Wallet;