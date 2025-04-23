"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TVStyleAuctionUI from './TVStyleAuctionUI';
import PlayerInfoCard from './PlayerInfoCard';
import BiddingRecommendationPanel from './BiddingRecommendationPanel';
import WalletConnector from './WalletConnector';
import BotWalletBalances from './BotWalletBalances';
import { getManualBiddingAdvice } from '@/ai/flows/ai-manual-bidding-recommendations';
import { aiBiddingStrategy } from '@/ai/flows/ai-bidding-strategy';
import { PlayerInfo, TeamInfo, getAllTeams, getShuffledPlayers } from '@/services/player-info';
import { ethers } from 'ethers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Volume2, VolumeX, Bot, Zap, Trophy } from 'lucide-react';
import { placeBid, getAuctionDetails } from '@/lib/auction-contract';
import { MONAD_CONFIG } from '@/lib/monad-utils';
import { isAIWallet, startAutoBidding, stopAutoBidding } from '@/lib/bot-bidding-service';
import { TeamPersonality } from '@/ai/flows/ai-agent-profiles';

// Default team for human users
const DEFAULT_USER_TEAM: TeamInfo = {
  teamId: 'default-user-team',
  name: 'Your Team',
  logoUrl: 'https://ui-avatars.com/api/?name=Your+Team&background=1d2671&color=fff',
  primaryColor: '#1d2671',
  accentColor: '#C33764',
  owner: 'You',
  homeVenue: 'Your Home Stadium',
  championships: 0,
  coach: 'You',
  captain: 'You',
  stats: {
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    winPercentage: 0
  }
};

const AuctionPage: React.FC = () => {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [upcomingPlayers, setUpcomingPlayers] = useState<PlayerInfo[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string | null>(null);
  const [highestBidderName, setHighestBidderName] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userBidAmount, setUserBidAmount] = useState<string>('');
  const [autoBidEnabled, setAutoBidEnabled] = useState<boolean>(false);
  const [maxAutoBidAmount, setMaxAutoBidAmount] = useState<number>(0);
  const [autoBidStrategy, setAutoBidStrategy] = useState<string>('balanced');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);
  const [bidRecommendation, setBidRecommendation] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [isAuctionFinalized, setIsAuctionFinalized] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [ownedPlayerNFTs, setOwnedPlayerNFTs] = useState<string[]>([]);
  const [activeBotBidders, setActiveBotBidders] = useState<string[]>([]);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  // Format utility functions
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Initialize auction data
  useEffect(() => {
    const initializeAuction = async () => {
      try {
        setIsLoading(true);
        
        // Fetch players and teams
        const allPlayers = await getShuffledPlayers();
        const allTeams = await getAllTeams();
        
        if (allPlayers.length === 0) {
          throw new Error("Failed to fetch players");
        }
        
        setPlayers(allPlayers);
        setTeams(allTeams);
        
        // Initialize with the first player
        const currentPlayer = allPlayers[0];
        setSelectedPlayer(currentPlayer);
        setCurrentBid(currentPlayer.basePrice);
        
        // Set upcoming players (next 5 players)
        setUpcomingPlayers(allPlayers.slice(1, 6));
        
        // Initialize auction timer
        startAuctionTimer();
        
        // Start AI bot bidding check interval with shorter interval for more active bidding
        startAIBidCheckInterval();

        // Immediately trigger bot bidding to make sure bots start right away
        setTimeout(() => {
          if (currentPlayer) {
            checkAndProcessAIBids();
          }
        }, 2000);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize auction:", error);
        toast({
          title: "Error",
          description: "Failed to initialize auction data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    initializeAuction();
    
    // Clean up timers on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (botCheckInterval.current) {
        clearInterval(botCheckInterval.current);
      }
    };
  }, []);

  // Start timer to check for AI bids
  const startAIBidCheckInterval = () => {
    if (botCheckInterval.current) {
      clearInterval(botCheckInterval.current);
    }
    
    botCheckInterval.current = setInterval(() => {
      // Only process AI bots if auction is active
      if (remainingTime > 0 && selectedPlayer && !isAuctionFinalized) {
        checkAndProcessAIBids();
      }
    }, 1500);
  };

  // Check and process AI bids
  const checkAndProcessAIBids = async () => {
    // Exit early if no player is selected or auction is over
    if (!selectedPlayer || remainingTime <= 0 || isAuctionFinalized) {
      return;
    }
    
    try {
      console.log("Checking for AI bot bids for player:", selectedPlayer.name);
      
      // Get all AI bots
      const { getAllBotWallets } = await import('@/lib/bot-wallets');
      const allBots = await getAllBotWallets();
      console.log(`Found ${allBots.length} potential bot bidders`);
      
      // Always select at least one bot to bid to ensure active bidding
      const activeBots = allBots
        .filter(bot => 
          // Only include bots that have enough balance to bid
          bot.balance > currentBid * 1.05 && 
          // Don't bid if already highest bidder
          (!highestBidder || highestBidder.toLowerCase() !== bot.address.toLowerCase())
        )
        .slice(0, 1 + Math.floor(Math.random() * 2)); // Select 1-2 bots
      
      console.log(`Selected ${activeBots.length} bots to potentially bid this round`);
      
      // Keep track of active bot bidders
      setActiveBotBidders(prev => 
        [...new Set([...prev, ...activeBots.map(b => b.address)])]
      );
      
      // For each bot, calculate a bid amount and place it
      for (const bot of activeBots) {
        try {
          // Base bid increment between 5-15%
          const baseIncrement = 0.05 + (Math.random() * 0.10);
          
          // Add personality factor based on bot strategy
          let strategyFactor = 1.0;
          if (bot.strategy === 'aggressive') {
            strategyFactor = 1.2; // Aggressive bots bid higher
          } else if (bot.strategy === 'conservative') {
            strategyFactor = 0.8; // Conservative bots bid lower
          }
          
          // Calculate bid amount with strategy factor applied
          const bidFactor = baseIncrement * strategyFactor;
          const maxBid = bot.balance * 0.95; // Use up to 95% of balance
          
          // Calculate bid amount
          let bidAmount = currentBid * (1 + bidFactor);
          
          // Ensure minimum bid increment of 0.0001
          bidAmount = Math.max(bidAmount, currentBid + 0.0001);
          
          // Cap the bid at the bot's max
          if (bidAmount > maxBid) {
            bidAmount = maxBid;
          }
          
          // Round to 4 decimals - changed from const to let to allow modification
          let roundedBid = Math.round(bidAmount * 10000) / 10000;
          
          console.log(`Bot ${bot.name} will place a bid of ${roundedBid}`);
          
          // Make sure the bid is at least slightly higher than current bid
          if (roundedBid <= currentBid) {
            roundedBid = currentBid + 0.0001;
          }
          
          // Process the bot bid
          await processAIBotBid(bot.address, bot.name, roundedBid);
          
          // Only one bot bids per check to avoid multiple bids at once
          break;
        } catch (error) {
          console.error(`Error processing bot ${bot.name} bid:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing AI bids:", error);
    }
  };

  // Process a bid from an AI bot
  const processAIBotBid = async (botAddress: string, botName: string, amount: number) => {
    try {
      console.log(`AI Bot ${botName} (${botAddress}) is placing a bid of ${amount}`);
      
      // Get the bot wallet details
      const botWallet = await import('@/lib/bot-wallets').then(
        ({ getBotWalletByAddress }) => getBotWalletByAddress(botAddress)
      );
      
      if (!botWallet) {
        console.error(`Bot wallet not found for address ${botAddress}`);
        return false;
      }
      
      console.log(`Using bot wallet: ${botWallet.name} with balance ${botWallet.balance}`);
      
      // Get team information for display
      const teamInfo = botWallet.teamId ? {
        id: botWallet.teamId,
        name: botWallet.name
      } : null;
      
      console.log("Team info for bidding bot:", teamInfo);
      
      // First establish a provider if not already done
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        try {
          console.log("Creating new provider from window.ethereum");
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);
        } catch (error) {
          console.error("Error creating provider:", error);
        }
      }
      
      // Update UI state immediately to show bot bidding activity
      setCurrentBid(amount);
      setHighestBidder(botAddress);
      setHighestBidderName(botWallet.name); // Use the actual team name
      
      // Add to bid history with team information
      const newBid = {
        timestamp: Date.now(),
        bidder: botAddress,
        amount: amount,
        botName: botWallet.name, // Use the team name
        teamId: botWallet.teamId, // Include team ID for styling/identification
        teamLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(botWallet.name)}&background=152238&color=fff&size=128` // Generate avatar for team
      };
      
      console.log("Adding new bid to history:", newBid);
      setBidHistory(prev => [...prev, newBid]);
      
      // Reset timer to give others time to respond
      if (remainingTime < 15) {
        setRemainingTime(15);
      }
      
      // Play bidding sound
      if (soundEnabled) {
        try {
          const bidSound = new Audio('/sounds/bid.mp3');
          bidSound.play().catch(err => console.log("Sound not played:", err));
        } catch (soundError) {
          console.error("Error playing sound:", soundError);
        }
      }
      
      // Show toast notification with team name
      toast({
        title: `${botWallet.name} places bid!`,
        description: `${botWallet.name} bid ${MONAD_CONFIG.nativeCurrency.symbol}${amount}`,
        variant: "default",
      });
      
      console.log(`Bot ${botWallet.name} successfully placed bid of ${amount} ETH`);
      return true;
    } catch (error) {
      console.error("Error in processAIBotBid:", error);
      return false;
    }
  };

  // Start auction timer
  const startAuctionTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setRemainingTime(30); // Reset to 30 seconds
    
    timerRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          // Timer finished
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleAuctionEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Handle auction end
  const handleAuctionEnd = () => {
    try {
      console.log("Auction ended for player:", selectedPlayer?.name);
      
      // Always clear the timer first to prevent multiple calls
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Handle end of current player auction
      if (highestBidder) {
        setIsAuctionFinalized(true);
        
        // Add final bid to history with 'SOLD' status
        const finalBid = {
          timestamp: Date.now() / 1000,
          bidder: highestBidder,
          bidderName: highestBidderName || 'Unknown',
          amount: currentBid,
          status: 'SOLD'
        };
        
        setBidHistory(prev => [...prev, finalBid]);
        
        toast({
          title: "Player Sold!",
          description: `${selectedPlayer?.name} sold to ${highestBidderName || formatAddress(highestBidder)} for ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
          variant: "default",
        });
        
        // Process payment automatically for AI bots with a slight delay to ensure UI updates first
        if (isAIWallet && highestBidder && isAIWallet(highestBidder)) {
          setTimeout(() => {
            processAIBotPayment();
          }, 3000);
        }
      } else {
        // No bidder, move to next player
        toast({
          title: "No Bids",
          description: `No bids were placed for ${selectedPlayer?.name}. Moving to next player.`,
          variant: "default",
        });
        
        // Slight delay before moving to next player to allow toast to be seen
        setTimeout(() => {
          moveToNextPlayer();
        }, 2000);
      }
    } catch (error) {
      console.error("Error in handleAuctionEnd:", error);
      toast({
        title: "Error",
        description: "There was an error processing the auction end. Moving to next player.",
        variant: "destructive",
      });
      
      // Try to recover by forcing next player after a delay
      setTimeout(() => {
        try {
          moveToNextPlayer();
        } catch (moveError) {
          console.error("Failed to move to next player:", moveError);
          // Last resort: just refresh the state to a safe value
          if (players.length > currentPlayerIndex + 1) {
            setCurrentPlayerIndex(prev => prev + 1);
            setSelectedPlayer(players[currentPlayerIndex + 1]);
            setIsAuctionFinalized(false);
            setHighestBidder(null);
            setHighestBidderName(null);
            setIsPaid(false);
            startAuctionTimer();
          }
        }
      }, 2000);
    }
  };

  // Process payment for AI bots
  const processAIBotPayment = async () => {
    if (!highestBidder || !selectedPlayer) {
      console.error("Missing data for processing bot payment");
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      console.log(`Processing AI bot payment for ${highestBidderName} (${highestBidder})`);
      
      // Get the bot wallet information
      const botWallet = await import('@/lib/bot-wallets').then(
        ({ getBotWalletByAddress }) => getBotWalletByAddress(highestBidder || '')
      );
      
      if (!botWallet) {
        throw new Error(`Bot wallet not found for address ${highestBidder}`);
      }
      
      // Initialize provider if not already done
      if (!provider) {
        if (typeof window !== 'undefined' && window.ethereum) {
          setProvider(new ethers.BrowserProvider(window.ethereum));
        } else {
          // Fallback to a direct provider
          setProvider(new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia"));
        }
      }
      
      // Show payment processing message
      toast({
        title: "Bot Payment Processing",
        description: `${highestBidderName} is processing payment via smart contract...`,
        variant: "default",
      });

      // FIXED: Use simulated payment for more reliable demo functionality
      console.log("Using simulated payment for more reliable demo");
      simulateBotPayment();
      
      // Only attempt actual contract payment in production environment
      /* Disabled contract payment for demo purposes
      import('@/lib/auction-contract').then(async ({ BOT_PAYMENT_CONTRACT_ADDRESS, BOT_PAYMENT_CONTRACT_ABI, MODERATOR_ADDRESS }) => {
        try {
          console.log("Contract addresses:", {
            BOT_PAYMENT_CONTRACT_ADDRESS,
            MODERATOR_ADDRESS,
            botAddress: highestBidder
          });
          
          // Create signer for the bot wallet
          const botSigner = new ethers.Wallet(botWallet.privateKey, provider);
          
          // Connect to the BotPayment contract
          const botPaymentContract = new ethers.Contract(
            BOT_PAYMENT_CONTRACT_ADDRESS,
            BOT_PAYMENT_CONTRACT_ABI,
            botSigner
          );
          
          console.log(`Sending payment of ${currentBid} ETH from ${botWallet.name} to moderator ${MODERATOR_ADDRESS}`);
          
          // Call payModerator function with the bid amount
          const tx = await botPaymentContract.payModerator({
            value: ethers.parseEther(currentBid.toString())
          });
          
          console.log("Transaction sent:", tx.hash);
          
          // Wait for transaction confirmation
          const receipt = await tx.wait();
          console.log(`Payment transaction confirmed with hash: ${receipt.hash}`);
          
          // Update state to mark as paid
          setIsPaid(true);
          setIsProcessingPayment(false);
          
          // Alert everyone
          toast({
            title: "Bot Payment Completed",
            description: `${highestBidderName} has automatically paid ${currentBid.toFixed(5)} ETH to the moderator via smart contract`,
            variant: "default",
          });
          
          // Move to next player after a short delay to show payment completed
          setTimeout(() => {
            moveToNextPlayer();
          }, 5000);
        } catch (error) {
          console.error("Error in bot payment contract transaction:", error);
          setIsProcessingPayment(false);
          
          // Provide fallback payment simulation for demo purposes
          console.log("Using fallback payment simulation for demo");
          simulateBotPayment();
        }
      }).catch(err => {
        console.error("Error importing auction contract:", err);
        simulateBotPayment();
      });
      */
    } catch (error) {
      console.error("Error processing bot payment:", error);
      setIsProcessingPayment(false);
      
      // Fallback to simulation for demo purposes
      simulateBotPayment();
    }
  };

  // Fallback simulation for bot payments when contract interaction fails
  const simulateBotPayment = () => {
    console.log("Simulating bot payment for demo purposes");
    
    try {
      // Simulate blockchain transaction delay
      setTimeout(() => {
        // Mark as paid
        setIsPaid(true);
        setIsProcessingPayment(false);
        
        // Alert everyone
        toast({
          title: "Bot Payment Completed (Simulated)",
          description: `${highestBidderName} has paid ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
          variant: "default",
        });
        
        // Update bot wallet balance (simulated)
        if (highestBidder && selectedPlayer) {
          console.log(`Updating bot wallet balance for ${highestBidderName}`);
        }
        
        // Move to next player after a short delay with error handling
        setTimeout(() => {
          try {
            console.log("Moving to next player after successful bot payment");
            moveToNextPlayer();
          } catch (error) {
            console.error("Error moving to next player after bot payment:", error);
            // Attempt recovery by refreshing the auction
            toast({
              title: "Auction Reset",
              description: "The auction has been reset due to an error.",
              variant: "default",
            });
            
            // Force reset auction state manually if moveToNextPlayer fails
            if (players.length > currentPlayerIndex + 1) {
              const nextPlayer = players[currentPlayerIndex + 1];
              setSelectedPlayer(nextPlayer);
              setCurrentBid(nextPlayer.basePrice || 0.1);
              setHighestBidder(null);
              setHighestBidderName(null);
              setBidHistory([]);
              setIsAuctionFinalized(false);
              setIsPaid(false);
              setRemainingTime(30);
              
              // Restart the auction timer manually
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              timerRef.current = setInterval(() => {
                setRemainingTime((prevTime) => {
                  if (prevTime <= 1) {
                    clearInterval(timerRef.current as NodeJS.Timeout);
                    handleAuctionEnd();
                    return 0;
                  }
                  return prevTime - 1;
                });
              }, 1000);
            }
          }
        }, 3000);
      }, 2000);
    } catch (error) {
      console.error("Error in simulateBotPayment:", error);
      // Ensure we don't get stuck in processing state
      setIsProcessingPayment(false);
      
      toast({
        title: "Error Processing Payment",
        description: "There was an error with the payment. Moving to next player.",
        variant: "destructive",
      });
      
      // Try to recover by moving to next player
      setTimeout(() => {
        moveToNextPlayer();
      }, 2000);
    }
  };

  // Process payment for human users
  const handleUserPayment = async () => {
    if (!highestBidder || !selectedPlayer || !isWalletConnected) {
      toast({
        title: "Payment Error",
        description: "Cannot process payment. Please ensure your wallet is connected.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Show payment processing message
      toast({
        title: "Processing Payment",
        description: `Processing your payment of ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
        variant: "default",
      });
      
      // For demo purposes, use simulated payment which is more reliable
      console.log("Using simulated payment for better demo experience");
      
      // Important: We use await here to ensure the payment completes before continuing
      await new Promise(resolve => {
        simulateUserPaymentAsync(resolve);
      });
      
      /* Disabled real transaction code for demo purposes
      if (!provider) {
        // Create a provider if it doesn't exist
        if (typeof window !== 'undefined' && window.ethereum) {
          setProvider(new ethers.BrowserProvider(window.ethereum));
        } else {
          setProvider(new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia"));
        }
      }
      
      // Get signer for the transaction
      const signer = await provider.getSigner();
      
      // Import the moderator address from auction contract
      const { MODERATOR_ADDRESS } = await import('@/lib/auction-contract');
      
      if (!MODERATOR_ADDRESS) {
        throw new Error("Moderator address not found");
      }
      
      // Perform the manual transaction
      const tx = await signer.sendTransaction({
        to: MODERATOR_ADDRESS,
        value: ethers.parseEther(currentBid.toString()),
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
      
      // Update payment status
      setIsPaid(true);
      setIsProcessingPayment(false);
      
      // Update owned NFTs
      if (selectedPlayer) {
        setOwnedPlayerNFTs(prev => [...prev, selectedPlayer.name]);
      }
      
      toast({
        title: "Payment Successful!",
        description: `You've successfully purchased ${selectedPlayer.name} for ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
        variant: "default",
      });
      
      // Move to next player after a delay
      setTimeout(() => {
        moveToNextPlayer();
      }, 3000);
      */
    } catch (error) {
      console.error("Payment failed:", error);
      setIsProcessingPayment(false);
      
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Async version of simulateUserPayment with promise resolution for better control
  const simulateUserPaymentAsync = (onComplete: () => void) => {
    console.log("Simulating user payment for demo purposes");
    toast({
      title: "Simulating Payment",
      description: "Using simulated payment for demonstration",
      variant: "default",
    });
    
    // Simulate blockchain transaction delay
    setTimeout(() => {
      try {
        // Mark as paid
        setIsPaid(true);
        setIsProcessingPayment(false);
        
        // Update owned NFTs
        if (selectedPlayer) {
          setOwnedPlayerNFTs(prev => [...prev, selectedPlayer.name]);
        }
        
        // Alert everyone with custom success sound
        toast({
          title: "Payment Successful",
          description: `You've successfully purchased ${selectedPlayer?.name} for ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
          variant: "default",
        });
        
        // Play success sound
        if (soundEnabled) {
          try {
            const successSound = new Audio('/sounds/win.mp3');
            successSound.play().catch(err => console.log("Sound not played:", err));
          } catch (soundError) {
            console.error("Error playing sound:", soundError);
          }
        }
        
        // Wait for confirmation before moving to next player
        setTimeout(() => {
          console.log("Payment simulation complete, calling onComplete callback");
          onComplete();
          
          // Move to next player after completion
          setTimeout(() => {
            moveToNextPlayer();
          }, 3000);
        }, 1000);
      } catch (error) {
        console.error("Error in simulateUserPayment:", error);
        setIsProcessingPayment(false);
        onComplete();
      }
    }, 3000); // Increased delay to 3 seconds to make payment more visible
  };

  // Legacy simulation method (kept for compatibility)
  const simulateUserPayment = () => {
    simulateUserPaymentAsync(() => {});
  };

  // Move to next player in the auction
  const moveToNextPlayer = () => {
    // Clear any existing timers first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      if (currentPlayerIndex < players.length - 1) {
        const nextIndex = currentPlayerIndex + 1;
        const nextPlayer = players[nextIndex];
        
        if (!nextPlayer) {
          console.error("Next player is undefined, cannot proceed");
          toast({
            title: "Error",
            description: "Failed to load next player. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }
        
        setCurrentPlayerIndex(nextIndex);
        setSelectedPlayer(nextPlayer);
        setCurrentBid(nextPlayer.basePrice || 0.1); // Provide a fallback base price
        setHighestBidder(null);
        setHighestBidderName(null);
        setBidHistory([]);
        setIsAuctionFinalized(false);
        setIsPaid(false);
        
        // Update upcoming players safely
        if (players.length > nextIndex + 1) {
          setUpcomingPlayers(players.slice(nextIndex + 1, nextIndex + 6));
        } else {
          setUpcomingPlayers([]);
        }
        
        // Reset AI recommendation
        setAiRecommendation(null);
        setBidRecommendation(null);
        
        // Start new timer with slight delay to ensure state updates first
        setTimeout(() => {
          startAuctionTimer();
        }, 100);
        
        // Generate new AI recommendations if wallet is connected
        if (isWalletConnected && selectedTeam && nextPlayer) {
          setTimeout(() => {
            generateAiRecommendations(nextPlayer);
          }, 500);
        }
        
        // Reset bot bidders for this round
        setActiveBotBidders([]);
        
        toast({
          title: "New Player Auction",
          description: `Now bidding for ${nextPlayer.name}`,
          variant: "default",
        });
      } else {
        // End of auction
        setIsAuctionFinalized(true);
        toast({
          title: "Auction Complete",
          description: "All players have been auctioned.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error in moveToNextPlayer:", error);
      toast({
        title: "Error",
        description: "An error occurred while moving to the next player.",
        variant: "destructive",
      });
    }
  };

  // Generate AI recommendations for bidding
  const generateAiRecommendations = async (player: PlayerInfo) => {
    if (!player) return;
    
    try {
      // Get AI bidding recommendation
      const bidRecommend = await getManualBiddingAdvice({
        player: player,
        currentBid: player.basePrice,
        remainingBudget: walletBalance,
        teamNeeds: "balanced" // Using string as expected by the API
      });
      
      setBidRecommendation(bidRecommend);
      
      // Get AI strategy recommendation
      const strategyRecommend = await aiBiddingStrategy({
        playerEvaluationScore: 7,
        agentStrategyType: 'balanced',
        teamNeedsScore: 7,
        remainingBudget: walletBalance,
        currentBid: player.basePrice,
        basePrice: player.basePrice
      });
      
      setAiRecommendation(strategyRecommend);
    } catch (error) {
      console.error("Failed to generate AI recommendations:", error);
    }
  };

  // Handle placing a bid
  const handlePlaceBid = (amount: number) => {
    if (!isWalletConnected || remainingTime <= 0) {
      toast({
        title: "Cannot Place Bid",
        description: isWalletConnected ? "Auction for this player has ended" : "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= currentBid) {
      toast({
        title: "Invalid Bid",
        description: `Bid must be higher than the current bid of ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${MONAD_CONFIG.nativeCurrency.symbol} to place this bid`,
        variant: "destructive",
      });
      return;
    }
    
    // Update bid information
    setCurrentBid(amount);
    setHighestBidder(walletAddress);
    setHighestBidderName("You");
    
    // Add to bid history
    const newBid = {
      timestamp: Date.now() / 1000,
      bidder: walletAddress,
      bidderName: "You",
      amount: amount,
    };
    
    setBidHistory([...bidHistory, newBid]);
    
    // Reset user bid input
    setUserBidAmount('');
    
    // Reset timer to give others time to respond
    if (remainingTime < 15) {
      setRemainingTime(15);
    }
    
    // Notify of successful bid
    toast({
      title: "Bid Placed",
      description: `You have placed a bid of ${MONAD_CONFIG.nativeCurrency.symbol}${amount.toFixed(5)}`,
      variant: "default",
    });
  };

  // Toggle auto-bidding
  const toggleAutoBidding = async () => {
    if (!isWalletConnected || !selectedPlayer) {
      toast({
        title: "Auto-bid Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    const newState = !autoBidEnabled;
    setAutoBidEnabled(newState);
    
    if (newState) {
      // Enable auto-bidding
      await startAutoBidding({
        maxAmount: maxAutoBidAmount,
        strategy: autoBidStrategy,
        playerId: String(selectedPlayer.id),
        currentBid: currentBid
      });
      
      toast({
        title: "Auto-bidding Enabled",
        description: `Auto-bidding enabled with max amount ${MONAD_CONFIG.nativeCurrency.symbol}${maxAutoBidAmount.toFixed(5)}`,
        variant: "default",
      });
    } else {
      // Disable auto-bidding
      await stopAutoBidding();
      
      toast({
        title: "Auto-bidding Disabled",
        description: "Auto-bidding has been disabled",
        variant: "default",
      });
    }
  };

  // Handle wallet connection
  const handleWalletConnected = (address: string, balance: number, provider: ethers.BrowserProvider) => {
    setWalletAddress(address);
    setWalletBalance(balance);
    setIsWalletConnected(true);
    setProvider(provider);
    
    // Auto-assign the default team to the user
    setSelectedTeam(DEFAULT_USER_TEAM);
    
    // Check for moderator access
    import('@/lib/bot-wallets').then(({ isModeratorWallet, isAIWallet }) => {
      // Check if wallet is moderator
      const isMod = isModeratorWallet(address);
      setIsModerator(isMod);
      
      const isAI = isAIWallet(address);
      if (isAI) {
        toast({
          title: "AI Wallet Simulation",
          description: "You're using an AI-controlled wallet for simulation purposes.",
          variant: "default",
        });
      } else if (isMod) {
        toast({
          title: "Moderator Access",
          description: "Welcome, Moderator. You have access to advanced auction controls.",
          variant: "default",
        });
      } else {
        toast({
          title: "Wallet Connected",
          description: `Connected with balance: ${balance.toFixed(4)} ${MONAD_CONFIG.nativeCurrency.symbol}`,
          variant: "default",
        });
      }
    });
    
    // Generate AI recommendations if player is selected
    if (selectedPlayer) {
      generateAiRecommendations(selectedPlayer);
    }
  };

  // Determine if the current user is the winner
  const isCurrentUserWinner = walletAddress && highestBidder && 
    walletAddress.toLowerCase() === highestBidder.toLowerCase();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 text-white">
      {/* Main auction interface */}
      <TVStyleAuctionUI
        playerInfo={selectedPlayer || {}}
        upcomingPlayers={upcomingPlayers}
        currentBid={currentBid}
        currentBidder={highestBidder || ''}
        bidderName={highestBidderName || ''}
        bidHistory={bidHistory}
        auctionStatus={remainingTime > 0 ? "Active" : "Sold"}
        moderatorMessage={`Bidding for ${selectedPlayer?.name || "Player"}`}
        moderatorRecommendation={selectedPlayer ? `${selectedPlayer.name} is a ${selectedPlayer.role} with a base price of ${MONAD_CONFIG.nativeCurrency.symbol}${selectedPlayer.basePrice}` : ''}
        countdownTimer={remainingTime}
        activeBidders={activeBotBidders.length + (isWalletConnected ? 1 : 0)}
        onPlaceBid={handlePlaceBid}
        onToggleTTS={() => setSoundEnabled(!soundEnabled)}
        isTTSEnabled={soundEnabled}
        userWalletBalance={walletBalance}
        currencySymbol={MONAD_CONFIG.nativeCurrency.symbol}
        onAutoBidToggle={toggleAutoBidding}
        onAutoBidAmountChange={setMaxAutoBidAmount}
        isAutoBidEnabled={autoBidEnabled}
        autoBidAmount={maxAutoBidAmount}
        maxAutoBidAmount={walletBalance}
        onConnectWallet={() => {/* Handled by WalletConnector component */}}
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        aiRecommendation={aiRecommendation}
        isLoadingRecommendation={!aiRecommendation && isWalletConnected}
        selectedTeam={selectedTeam}
        isPaid={isPaid}
        isAuctionFinalized={isAuctionFinalized}
        onPayFinalizedAmount={handleUserPayment}
        isProcessingPayment={isProcessingPayment}
        isCurrentUserWinner={!!isCurrentUserWinner}
        ownedNFTs={ownedPlayerNFTs}
        isModerator={isModerator}
        currentPlayerIndex={currentPlayerIndex}
        playerQueue={players}
        setCurrentPlayerIndex={setCurrentPlayerIndex}
        onPlaceUserBid={(amount: string) => {
          handlePlaceBid(parseFloat(amount));
        }}
        userBidInput={userBidAmount}
        setUserBidInput={setUserBidAmount}
      />
      
      {/* Side Panel with wallet connection and bidding tools */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-900/90 backdrop-blur-sm p-4 border-t border-blue-900/30 shadow-2xl z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {!isWalletConnected ? (
              <WalletConnector 
                onWalletConnected={handleWalletConnected}
                isConnected={isWalletConnected}
                walletAddress={walletAddress}
                walletBalance={walletBalance}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-900/40 border-blue-500/30 px-3 py-1">
                  <span className="text-blue-300">{formatAddress(walletAddress)}</span>
                </Badge>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <Zap size={14} /> 
                  {walletBalance.toFixed(4)} {MONAD_CONFIG.nativeCurrency.symbol}
                </span>
                {ownedPlayerNFTs.length > 0 && (
                  <Badge variant="outline" className="bg-purple-900/40 border-purple-500/30 px-3 py-1 flex items-center">
                    <Trophy size={14} className="mr-1 text-yellow-400" />
                    <span className="text-purple-300">{ownedPlayerNFTs.length} Players</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Bidding Controls */}
          {isWalletConnected && selectedPlayer && remainingTime > 0 && !isAuctionFinalized && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="number"
                  min={currentBid + 0.0001}
                  step={0.0001}
                  value={userBidAmount}
                  onChange={(e) => setUserBidAmount(e.target.value)}
                  placeholder={`Min: ${(currentBid + 0.0001).toFixed(4)}`}
                  className="bg-slate-800 text-white border border-blue-500/30 rounded-lg px-3 py-2 w-32 md:w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                onClick={() => userBidAmount && handlePlaceBid(parseFloat(userBidAmount))}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={!userBidAmount || parseFloat(userBidAmount) <= currentBid || parseFloat(userBidAmount) > walletBalance}
              >
                Place Bid
              </Button>
              
              {/* Sound Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
              
              {/* Auto-bid Toggle */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg py-1 px-2 border border-purple-900/30">
                <Switch
                  checked={autoBidEnabled}
                  onCheckedChange={toggleAutoBidding}
                  className="data-[state=checked]:bg-purple-600"
                />
                <span className="text-sm text-slate-300">Auto-Bid</span>
              </div>
            </div>
          )}
          
          {/* Payment Button (when auction is finalized) */}
          {isCurrentUserWinner && isAuctionFinalized && !isPaid && (
            <Button
              onClick={handleUserPayment}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : `Pay ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)} Now`}
            </Button>
          )}
        </div>
      </div>
      
      {/* Recommendation Side Panel */}
      {showRecommendations && isWalletConnected && aiRecommendation && (
        <div className="hidden lg:block fixed right-4 top-20 w-80 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-lg border border-blue-900/30 p-4 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-300">AI Insight</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowRecommendations(false)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-white rounded-full"
            >
              ✕
            </Button>
          </div>
          
          <BiddingRecommendationPanel 
            player={selectedPlayer}
            currentBid={currentBid}
            walletBalance={walletBalance}
            onPlaceBid={handlePlaceBid}
            recommendation={bidRecommendation}
            currencySymbol={MONAD_CONFIG.nativeCurrency.symbol}
          />
        </div>
      )}
    </div>
  );
};

export default AuctionPage;

