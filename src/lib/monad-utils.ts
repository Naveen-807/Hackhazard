import { ethers } from "ethers";

// Monad Testnet configuration
export const MONAD_CONFIG = {
  chainId: 10143,
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"]
};

export const MICRO_MONAD = 1e12; // 1 MONAD = 10^18 wei, 1 micro MONAD = 10^12 wei

// Function to convert MONAD amount to wei
export const parseMonadAmount = (amount: number) => {
  return ethers.parseEther(amount.toString());
};

// Function to format wei amount to MONAD
export const formatMonadAmount = (weiAmount: bigint | string) => {
  return ethers.formatEther(weiAmount);
};

// Function to format address (truncate for display)
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Function to connect to Monad wallet via MetaMask
export const connectWallet = async (): Promise<{
  success: boolean;
  address?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  error?: string;
}> => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      return {
        success: false,
        error: "MetaMask not installed. Please install MetaMask to use this application."
      };
    }

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    
    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: "No accounts found. Please unlock MetaMask and try again."
      };
    }
    
    const address = accounts[0];
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check if connected to Monad Testnet
    const network = await provider.getNetwork();
    
    if (network.chainId !== BigInt(MONAD_CONFIG.chainId)) {
      // Prompt user to switch to Monad Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${MONAD_CONFIG.chainId.toString(16)}` }]
        });
      } catch (switchError: any) {
        // If chain hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${MONAD_CONFIG.chainId.toString(16)}`,
                chainName: MONAD_CONFIG.chainName,
                nativeCurrency: MONAD_CONFIG.nativeCurrency,
                rpcUrls: MONAD_CONFIG.rpcUrls,
                blockExplorerUrls: MONAD_CONFIG.blockExplorerUrls
              }
            ]
          });
        } else {
          return {
            success: false,
            error: "Failed to switch to Monad Testnet. Please switch manually."
          };
        }
      }
      
      // Refresh provider and signer after network switch
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const updatedSigner = await updatedProvider.getSigner();
      
      return {
        success: true,
        address,
        provider: updatedProvider,
        signer: updatedSigner
      };
    }
    
    return {
      success: true,
      address,
      provider,
      signer
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to wallet"
    };
  }
};

// Function to connect to Monad Testnet
export const connectToMonadTestnet = async (): Promise<{
  success: boolean;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  address?: string;
  error?: string;
  needsManualNetworkConfig?: boolean;
  networkDetails?: {
    chainName: string;
    rpcUrl: string;
    chainId: number;
    symbol: string;
    decimals: number;
  };
}> => {
  try {
    console.log("Connecting to Monad Testnet...");
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      return {
        success: false,
        error: "MetaMask not installed. Please install MetaMask to use this application."
      };
    }

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    
    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: "No accounts found. Please unlock MetaMask and try again."
      };
    }
    
    const address = accounts[0];
    console.log("Connected to wallet address:", address);
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check if connected to Monad Testnet
    const network = await provider.getNetwork();
    console.log("Current network:", network.name, network.chainId.toString());
    
    // Convert chainId to hex format with 0x prefix
    const chainIdHex = "0x" + MONAD_CONFIG.chainId.toString(16);
    
    if (network.chainId !== BigInt(MONAD_CONFIG.chainId)) {
      console.log("Not connected to Monad Testnet. Attempting to switch...");
      
      try {
        // Try switching to the network first (if it already exists in MetaMask)
        console.log("Attempting to switch to Monad Testnet chain ID:", chainIdHex);
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainIdHex }]
          });
          console.log("Successfully switched to Monad Testnet");
        } catch (switchError: any) {
          console.log("Switch error:", switchError.code, switchError.message);
          
          // If error code 4902, network doesn't exist yet, so add it
          if (switchError.code === 4902) {
            console.log("Network doesn't exist in MetaMask, adding it now...");
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: MONAD_CONFIG.chainName,
                  nativeCurrency: MONAD_CONFIG.nativeCurrency,
                  rpcUrls: MONAD_CONFIG.rpcUrls,
                  blockExplorerUrls: MONAD_CONFIG.blockExplorerUrls
                }
              ]
            });
            console.log("Successfully added Monad Testnet to MetaMask");
          } else {
            // If we can't automatically add the network, provide details for manual setup
            console.log("Failed to add network automatically, will provide manual config");
            return {
              success: false,
              needsManualNetworkConfig: true,
              networkDetails: {
                chainName: MONAD_CONFIG.chainName,
                rpcUrl: MONAD_CONFIG.rpcUrls[0],
                chainId: MONAD_CONFIG.chainId,
                symbol: MONAD_CONFIG.nativeCurrency.symbol,
                decimals: MONAD_CONFIG.nativeCurrency.decimals
              },
              error: "Please add the network manually in MetaMask."
            };
          }
        }
        
        // Refresh provider and signer after network switch
        console.log("Refreshing provider and signer after network change");
        const updatedProvider = new ethers.BrowserProvider(window.ethereum);
        const updatedSigner = await updatedProvider.getSigner();
        
        // Verify we're now on the correct network
        const updatedNetwork = await updatedProvider.getNetwork();
        console.log("Updated network after switch:", updatedNetwork.name, updatedNetwork.chainId.toString());
        
        if (updatedNetwork.chainId !== BigInt(MONAD_CONFIG.chainId)) {
          return {
            success: false,
            error: "Failed to switch to Monad Testnet after adding it."
          };
        }
        
        console.log("Successfully connected to Monad Testnet");
        return {
          success: true,
          address,
          provider: updatedProvider,
          signer: updatedSigner
        };
      } catch (error: any) {
        console.error("Error connecting to Monad network:", error);
        return {
          success: false,
          error: "Failed to connect to Monad network: " + 
                (error.message || "Unknown error")
        };
      }
    }
    
    console.log("Already connected to Monad Testnet");
    return {
      success: true,
      address,
      provider,
      signer
    };
  } catch (error: any) {
    console.error("Wallet connection error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to wallet"
    };
  }
};

// Function to get wallet balance
export const getWalletBalance = async (
  provider: ethers.Provider,
  address: string
): Promise<{
  success: boolean;
  balance?: number; // in MONAD
  error?: string;
}> => {
  try {
    const balanceWei = await provider.getBalance(address);
    const balance = Number(formatMonadAmount(balanceWei));
    
    return {
      success: true,
      balance
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get wallet balance"
    };
  }
};

// Function to send MONAD to another address
export const sendMonad = async (
  signer: ethers.Signer,
  toAddress: string,
  amount: number // in MONAD
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    // Validate address
    if (!ethers.isAddress(toAddress)) {
      return {
        success: false,
        error: "Invalid recipient address"
      };
    }
    
    // Convert amount to wei
    const amountWei = parseMonadAmount(amount);
    
    // Send transaction
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: amountWei
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt?.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send MONAD"
    };
  }
};

// Function to send moderated transaction
export const sendModeratedTransaction = async (
  signer: ethers.Signer,
  toAddress: string,
  amount: number,
  moderatorAddress: string
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  try {
    console.log(`Sending moderated transaction to ${toAddress} for ${amount} MON`);

    // Validate the recipient address
    if (!ethers.isAddress(toAddress)) {
      return {
        success: false,
        error: "Invalid recipient address"
      };
    }

    // For real-world applications, we would verify the transaction with a moderator contract
    // For this demo, we're going to send a direct transaction using testnet tokens
    
    // Get the sender's address
    const fromAddress = await signer.getAddress();
    console.log(`Sending from: ${fromAddress}`);
    
    // Add transaction data for NFT minting
    let data = "0x"; // Empty data for regular token transfers
    
    // If this is a bid transaction, use regular transfer
    // If this is an NFT minting transaction, add NFT minting data
    const isNftMint = toAddress.toLowerCase() !== moderatorAddress.toLowerCase();
    
    if (isNftMint) {
      // This would be replaced with actual NFT contract interaction in production
      // For demo, we just log that this would be an NFT mint
      console.log("This is an NFT minting transaction");
      // In a real implementation, data would contain the NFT contract call
    }
    
    // Convert the amount to wei (smallest unit)
    const amountWei = parseMonadAmount(amount);
    console.log(`Amount in wei: ${amountWei.toString()}`);
    
    // Create transaction object
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: amountWei,
      data: data
    });
    
    console.log("Transaction sent:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);
    
    return {
      success: true,
      txHash: tx.hash
    };
  } catch (error: any) {
    console.error("Transaction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to send transaction"
    };
  }
};

// Function to connect MetaMask wallet specifically for auction transactions
export const connectAuctionWallet = async (): Promise<{
  success: boolean;
  address?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  balance?: string;
  error?: string;
}> => {
  try {
    console.log("Connecting MetaMask wallet for auction transactions...");
    
    // First, connect to Monad Testnet
    const monadConnection = await connectToMonadTestnet();
    
    if (!monadConnection.success) {
      return {
        success: false,
        error: monadConnection.error || "Failed to connect to Monad Testnet"
      };
    }
    
    // Verify we have all the required connection data
    if (!monadConnection.address || !monadConnection.provider || !monadConnection.signer) {
      return {
        success: false,
        error: "Incomplete connection data from Monad Testnet"
      };
    }
    
    // Get current balance
    const balanceWei = await monadConnection.provider.getBalance(monadConnection.address);
    const balance = formatMonadAmount(balanceWei);
    
    console.log(`Connected to auction wallet with address: ${monadConnection.address}`);
    console.log(`Current balance: ${balance} MON`);
    
    // Check if the balance is sufficient for transaction fees
    const { sufficient, minimumRequired } = await checkSufficientGasFunds(
      monadConnection.provider,
      monadConnection.address
    );
    
    if (!sufficient) {
      console.warn(`Wallet has insufficient funds for transaction fees. Balance: ${balance} MON, minimum required: ${minimumRequired} MON`);
    }
    
    // Return the connection info
    return {
      success: true,
      address: monadConnection.address,
      signer: monadConnection.signer,
      provider: monadConnection.provider,
      balance
    };
  } catch (error: any) {
    console.error("Error connecting auction wallet:", error);
    return {
      success: false,
      error: error.message || "Failed to connect auction wallet"
    };
  }
};

// Function to check if user has enough MON for gas fees
export const checkSufficientGasFunds = async (
  provider: ethers.Provider,
  address: string
): Promise<{
  sufficient: boolean;
  balance: string;
  minimumRequired: string;
}> => {
  try {
    // Get the current balance
    const balanceWei = await provider.getBalance(address);
    const balance = formatMonadAmount(balanceWei);
    
    // Minimum required for transactions (0.001 MON)
    const minimumRequired = "0.001";
    const minimumRequiredWei = ethers.parseEther(minimumRequired);
    
    // Compare balance to minimum required
    const sufficient = balanceWei >= minimumRequiredWei;
    
    return {
      sufficient,
      balance,
      minimumRequired
    };
  } catch (error) {
    console.error("Error checking gas funds:", error);
    return {
      sufficient: false,
      balance: "0",
      minimumRequired: "0.001"
    };
  }
};

// Interface declarations for TypeScript/window type safety
declare global {
  interface Window {
    ethereum: any;
  }
}