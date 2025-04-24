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
import { isAIWallet, startAutoBidding, stopAutoBidding, stopAllAutomatedBidding } from '@/lib/bot-bidding-service';

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
  const [finalAuctionStatus, setFinalAuctionStatus] = useState<string>("Active");
  const [paymentPending, setPaymentPending] = useState(false);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const hasEndedRef = useRef(false);
  const isMobile = useIsMobile();

  // Format utility functions
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Initialize auction data
  useEffect(() => {
    // Only initialize auction after wallet is connected
    if (!isWalletConnected) return;
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
  }, [isWalletConnected]);

  useEffect(() => {
    // Force a bot bid to ensure bid history is populated immediately after page loads
    const forceInitialBotBid = async () => {
      if (selectedPlayer && !isLoading) {
        setTimeout(async () => {
          try {
            console.log("Forcing an initial bot bid for demo purposes...");
            
            // Import bot wallets
            const { getAllBotWallets } = await import('@/lib/bot-wallets');
            const allBots = await getAllBotWallets();
            
            if (allBots.length > 0) {
              const demoBot = allBots[0];
              const initialBid = selectedPlayer.basePrice * 1.1;
              
              console.log(`Demo bot ${demoBot.name} will place a bid of ${initialBid.toFixed(2)}`);
              
              // Place a bid with this bot to populate bid history
              await processAIBotBid(demoBot.address, demoBot.name, initialBid);
              
              console.log("Force initial bot bid completed - check bid history now");
            }
          } catch (error) {
            console.error("Error forcing initial bot bid:", error);
          }
        }, 3000); // Wait 3 seconds after page loads before showing demo bid
      }
    };
    
    forceInitialBotBid();
    
  }, [selectedPlayer, isLoading]);

  // Start timer to check for AI bids
  const startAIBidCheckInterval = () => {
    if (botCheckInterval.current) {
      clearInterval(botCheckInterval.current);
    }
    // IMPROVED: More frequent checking for extremely active bidding
    botCheckInterval.current = setInterval(() => {
      // Only process AI bots if auction is active
      if (remainingTime > 0 && selectedPlayer && !isAuctionFinalized && !paymentPending) {
        checkAndProcessAIBids();
      }
    }, 300); // 300ms interval for very active bidding
  };

  // Check and process AI bids - MODIFIED TO ENSURE ALL BOTS PARTICIPATE
  const checkAndProcessAIBids = async () => {
    if (paymentPending) return;

    // Exit early if no player is selected or auction is over
    if (!selectedPlayer || remainingTime <= 0 || isAuctionFinalized) {
      return;
    }
    
    try {
      // Get all AI bots
      const { getAllBotWallets } = await import('@/lib/bot-wallets');
      const allBots = await getAllBotWallets();
      
      // ENHANCED: Use all bots for more active bidding
      // This ensures all bots participate in each auction
      let botsToUse = [];
      
      // Make all bots that aren't the highest bidder participate
      botsToUse = allBots.filter(bot => 
        !highestBidder || bot.address.toLowerCase() !== highestBidder.toLowerCase()
      );
      
      // If we somehow don't have any eligible bots, use any bot as fallback
      if (botsToUse.length === 0 && allBots.length > 0) {
        botsToUse = [allBots[0]];
      }
      
      console.log(`${botsToUse.length} bots will participate in this bidding round`);
      
      // Track active bidders
      setActiveBotBidders(prev => 
        [...new Set([...prev, ...botsToUse.map(b => b.address)])]
      );
      
      // Process each bot's bid with randomized delay to make bidding appear natural
      for (const bot of botsToUse) {
        // Skip if already highest bidder
        if (highestBidder && bot.address.toLowerCase() === highestBidder.toLowerCase()) {
          continue;
        }
        
        // Calculate a bid amount that will always work
        // Add some variance to bid increase (3-18%) for more realistic bidding
        const bidIncrease = 0.03 + (Math.random() * 0.15);
        let bidAmount = currentBid * (1 + bidIncrease);
        
        // Minimum increment of 0.001
        bidAmount = Math.max(bidAmount, currentBid + 0.001);
        
        // Cap at bot's balance (95% of wallet balance max)
        const maxBid = Math.min(bot.balance * 0.95, currentBid * 2.5);
        bidAmount = Math.min(bidAmount, maxBid);
        
        // Round to 4 decimals for cleaner numbers
        const roundedBid = Math.round(bidAmount * 10000) / 10000;
        
        // Add small random delay between bids for natural flow (50-800ms)
        const bidDelay = 50 + Math.floor(Math.random() * 750);
        await new Promise(resolve => setTimeout(resolve, bidDelay));
        
        // Process the bid without further checks
        await processAIBotBid(bot.address, bot.name, roundedBid);
      }
    } catch (error) {
      console.error("Error in bot bidding:", error);
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
      
      // Create new bid with enhanced visualization data
      const newBid = {
        timestamp: Date.now(),
        bidder: botAddress,
        amount: amount,
        botName: botWallet.name, // Use the team name
        teamId: botWallet.teamId, // Include team ID for styling/identification
        teamLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(botWallet.name)}&background=152238&color=fff&size=128` // Generate avatar for team
      };
      
      console.log("Adding new bid to history:", newBid);
      
      // Add bot bid to history and log the updated history for debugging
      setBidHistory(prev => {
        const updatedHistory = [...prev, newBid];
        console.log("Updated bid history:", updatedHistory);
        return updatedHistory;
      });
      
      // Ensure bid history persists by extending timer
      if (remainingTime < 15) {
        setRemainingTime(15);
        console.log("Extended timer to 15 seconds");
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
      
      // Force small delay to ensure bid is displayed in UI before any state changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error("Error in processAIBotBid:", error);
      return false;
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
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        setProvider(new ethers.BrowserProvider(window.ethereum));
      }
      
      // Show payment processing message
      toast({
        title: "Bot Payment Processing",
        description: `${highestBidderName} is processing payment via smart contract...`,
        variant: "default",
      });

      // Add pending transaction to bid history
      const pendingPaymentBid = {
        timestamp: Date.now() / 1000,
        bidder: highestBidder,
        bidderName: highestBidderName || 'Unknown',
        amount: currentBid,
        status: 'PROCESSING',
        botName: highestBidderName,
        teamLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(botWallet.name)}&background=152238&color=fff&size=128`
      };
      
      setBidHistory(prev => [...prev, pendingPaymentBid]);

      // Use simulated payment for more reliable demo functionality
      console.log("Using simulated payment for more reliable demo");
      simulateBotPayment();
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
      // Simulate blockchain transaction delay - varies by team for realistic feel
      const randomDelay = 1500 + Math.random() * 2000; // 1.5-3.5 seconds
      
      setTimeout(() => {
        // Mark as paid
        setIsPaid(true);
        setIsProcessingPayment(false);
        setPaymentPending(false);
        
        // Update the bid history with completed payment status
        setBidHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          
          if (lastIndex >= 0 && updated[lastIndex].bidder === highestBidder) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              status: 'PAID'
            };
          }
          
          return updated;
        });
        
        // Alert everyone
        toast({
          title: "Bot Payment Completed",
          description: `${highestBidderName} has paid ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
          variant: "default",
          duration: 5000,
        });
        
        // Update bot wallet balance (simulated)
        if (highestBidder && selectedPlayer) {
          console.log(`Updating bot wallet balance for ${highestBidderName}`);
        }
        
        // Play success sound
        if (soundEnabled) {
          try {
            const successSound = new Audio('/sounds/win.mp3');
            successSound.play().catch(err => console.log("Sound not played:", err));
          } catch (soundError) {
            console.error("Error playing sound:", soundError);
          }
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
                if (paymentPending) return;
                setRemainingTime((prevTime) => {
                  if (prevTime <= 1) {
                    clearInterval(timerRef.current as NodeJS.Timeout);
                    return 0;
                  }
                  return prevTime - 1;
                });
              }, 1000);
            }
          }
        }, 3000);
      }, randomDelay); // Variable delay for more realistic experience
    } catch (error) {
      console.error("Error in simulateBotPayment:", error);
      // Ensure we don't get stuck in processing state
      setIsProcessingPayment(false);
      setPaymentPending(false);
      
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

  // Start auction timer
  const startAuctionTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setRemainingTime(30); // Reset to 30 seconds
    
    timerRef.current = setInterval(() => {
      if (paymentPending) return; // Block timer decrement
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Trigger handleAuctionEnd when remainingTime === 0
  useEffect(() => {
    if (remainingTime === 0 && !hasEndedRef.current) {
      hasEndedRef.current = true;
      handleAuctionEnd();
    }
  }, [remainingTime]);

  // Handle auction end
  const handleAuctionEnd = async () => {
    try {
      console.log("Auction ended for player:", selectedPlayer?.name);
      // Debug: Print bid history and last bid
      console.log("[DEBUG] Full bidHistory at auction end:", bidHistory);
      const lastBid = bidHistory.length > 0 ? bidHistory[bidHistory.length - 1] : null;
      console.log("[DEBUG] Last bid at auction end:", lastBid);

      // Always clear the timer first to prevent multiple calls
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // FIX: Only mark as SOLD if the last bid is a real bid
      const isValidBid = lastBid && lastBid.bidder && lastBid.amount > 0;

      if (isValidBid) {
        setIsAuctionFinalized(true);
        setFinalAuctionStatus("Sold");
        let botTeamInfo = null;
        if (isAIWallet && highestBidder && isAIWallet(highestBidder)) {
          const { getBotWalletByAddress } = await import('@/lib/bot-wallets');
          const botWallet = await getBotWalletByAddress(highestBidder);
          if (botWallet) {
            botTeamInfo = {
              name: botWallet.name,
              teamLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(botWallet.name)}&background=152238&color=fff&size=128`
            };
          }
        }
        const finalBid = {
          timestamp: Date.now() / 1000,
          bidder: highestBidder,
          bidderName: highestBidderName || 'Unknown',
          amount: currentBid,
          status: 'SOLD',
          botName: botTeamInfo?.name || highestBidderName,
          teamLogo: botTeamInfo?.teamLogo
        };
        setBidHistory(prev => [...prev, finalBid]);
        if (selectedPlayer && highestBidderName) {
          try {
            const { generateModeratorCommentary } = await import('@/ai/ai-instance');
            const commentary = await generateModeratorCommentary(
              selectedPlayer.name,
              selectedPlayer.role || 'Player',
              currentBid, 
              highestBidderName,
              selectedPlayer.basePrice
            );
            toast({
              title: "Player Sold!",
              description: commentary,
              variant: "default",
            });
          } catch (commentaryError) {
            toast({
              title: "Player Sold!",
              description: `${selectedPlayer?.name} sold to ${highestBidderName || formatAddress(highestBidder)} for ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Player Sold!",
            description: `${selectedPlayer?.name} sold to ${highestBidderName || formatAddress(highestBidder)} for ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
            variant: "default",
          });
        }
        if (isAIWallet && highestBidder && isAIWallet(highestBidder)) {
          const randomDelay = 2000 + Math.random() * 3000;
          setTimeout(() => { processAIBotPayment(); }, randomDelay);
        }
        if (isCurrentUserWinner) {
          setPaymentPending(true);
          return;
        }
      } else {
        setFinalAuctionStatus("Unsold");
        const unsoldBid = {
          timestamp: Date.now() / 1000,
          bidder: null,
          bidderName: null,
          amount: currentBid,
          status: 'UNSOLD'
        };
        setBidHistory(prev => [...prev, unsoldBid]);
        toast({
          title: "No Bids",
          description: `No bids were placed for ${selectedPlayer?.name}. Moving to next player.`,
          variant: "default",
        });
        setIsAuctionFinalized(false);
        setIsPaid(false);
        setHighestBidder(null);
        setHighestBidderName(null);
        setTimeout(() => {
          try { moveToNextPlayer(); } catch (moveError) {
            if (players.length > currentPlayerIndex + 1) {
              const nextIndex = currentPlayerIndex + 1;
              setCurrentPlayerIndex(nextIndex);
              const nextPlayer = players[nextIndex];
              if (nextPlayer) {
                setSelectedPlayer(nextPlayer);
                setCurrentBid(nextPlayer.basePrice || 0.1);
                setBidHistory([]);
                setRemainingTime(30);
                startAuctionTimer();
              }
            }
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error in handleAuctionEnd:", error);
      toast({
        title: "Error",
        description: "There was an error processing the auction end. Moving to next player.",
        variant: "destructive",
      });
      
      // Force next player with guaranteed execution if there's an error
      setTimeout(() => {
        try {
          moveToNextPlayer();
        } catch (moveError) {
          console.error("Failed to move to next player:", moveError);
          // Last resort: just refresh the state to a safe value
          if (players.length > currentPlayerIndex + 1) {
            const nextIndex = currentPlayerIndex + 1;
            setCurrentPlayerIndex(nextIndex);
            const nextPlayer = players[nextIndex];
            if (nextPlayer) {
              setSelectedPlayer(nextPlayer);
              setCurrentBid(nextPlayer.basePrice || 0.1);
              setHighestBidder(null);
              setHighestBidderName(null);
              setBidHistory([]);
              setIsAuctionFinalized(false);
              setIsPaid(false);
              setRemainingTime(30);
              startAuctionTimer();
            }
          }
        }
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
      return { success: false, error: "Wallet not connected." };
    }
    try {
      setIsProcessingPayment(true);
      toast({
        title: "Processing Payment",
        description: `Processing your payment of ${MONAD_CONFIG.nativeCurrency.symbol}${currentBid.toFixed(5)}`,
        variant: "default",
      });
      if (!provider) {
        setIsProcessingPayment(false);
        setPaymentPending(false);
        return { success: false, error: "MetaMask not detected. Please connect your wallet." };
      }
      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(MONAD_CONFIG.chainId)) {
        setIsProcessingPayment(false);
        setPaymentPending(false);
        return { success: false, error: `Please switch MetaMask to the correct network (chainId: ${MONAD_CONFIG.chainId}).` };
      }
      // Get signer
      let signer;
      try {
        signer = await provider.getSigner();
      } catch (err) {
        setIsProcessingPayment(false);
        setPaymentPending(false);
        return { success: false, error: "Could not access your wallet. Please reconnect and try again." };
      }
      // Send real transaction to moderator
      const { MODERATOR_ADDRESS } = await import('@/lib/auction-contract');
      let tx;
      try {
        tx = await signer.sendTransaction({
          to: MODERATOR_ADDRESS,
          value: ethers.parseEther(currentBid.toString()),
          gasLimit: 50000,
        });
      } catch (error) {
        setIsProcessingPayment(false);
        setPaymentPending(false);
        const err = error as any;
        if (err?.message?.includes("user rejected")) {
          return { success: false, error: "Transaction was rejected. Please try again." };
        }
        if (err?.message?.includes("insufficient funds")) {
          return { success: false, error: "Insufficient funds in your wallet to complete this transaction." };
        }
        return { success: false, error: err?.message || "Transaction failed. Please try again." };
      }
      await tx.wait();
      toast({
        title: 'Transaction confirmed!',
        description: '',
        variant: 'default',
      });
      setIsPaid(true);
      setIsProcessingPayment(false);
      setPaymentPending(false);
      if (selectedPlayer) {
        setOwnedPlayerNFTs(prev => [...prev, selectedPlayer.name]);
      }
      toast({
        title: "Payment Successful!",
        description: `You have purchased ${selectedPlayer?.name} for ${currentBid.toFixed(5)} ${MONAD_CONFIG.nativeCurrency.symbol}!`,
        variant: "default",
      });
      return { success: true };
    } catch (error) {
      setIsProcessingPayment(false);
      setPaymentPending(false);
      toast({
        title: "Payment Failed",
        description: (error as any)?.message || "There was an error processing your payment.",
        variant: "destructive",
      });
      return { success: false, error: (error as any)?.message || "There was an error processing your payment." };
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
        setPaymentPending(false);
        
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
        setPaymentPending(false);
        onComplete();
      }
    }, 3000); // Increased delay to 3 seconds to make payment more visible
  };

  // Legacy simulation method (kept for compatibility)
  const simulateUserPayment = () => {
    simulateUserPaymentAsync(() => {});
  };

  // Move to next player
  const moveToNextPlayer = () => {
    if (paymentPending) return;

    hasEndedRef.current = false;
    try {
      console.log("Moving to next player...");
      
      // Always clear the auction state first
      setIsAuctionFinalized(false);
      setIsPaid(false);
      setHighestBidder(null);
      setHighestBidderName(null);
      setFinalAuctionStatus("Active");
      
      // Stop any bot bidding activity from previous round
      stopAllAutomatedBidding();
      
      // Reset active bidders
      setActiveBotBidders([]);
      
      // Calculate next player index
      const nextIndex = currentPlayerIndex + 1;
      
      if (nextIndex < players.length) {
        console.log(`Moving to player at index ${nextIndex}: ${players[nextIndex]?.name}`);
        
        // Get next player
        const nextPlayer = players[nextIndex];
        
        // Update player selection and auction state
        setCurrentPlayerIndex(nextIndex);
        setSelectedPlayer(nextPlayer);
        setCurrentBid(nextPlayer.basePrice || 0.1); // Provide a fallback base price
        setBidHistory([]);
        
        // Update upcoming players
        if (players.length > nextIndex + 1) {
          setUpcomingPlayers(players.slice(nextIndex + 1, nextIndex + 6));
        } else {
          setUpcomingPlayers([]);
        }
        
        // Reset AI recommendation
        setAiRecommendation(null);
        setBidRecommendation(null);
        
        // Reset timer (important!)
        setRemainingTime(30);
        startAuctionTimer();
        startAIBidCheckInterval(); // Ensure bots start bidding for the new player

        // Immediately trigger bot bidding after a short delay
        setTimeout(() => {
          checkAndProcessAIBids();
        }, 1000);
        
        // Generate new AI recommendations if wallet is connected
        if (isWalletConnected && nextPlayer) {
          setTimeout(() => {
            generateAiRecommendations(nextPlayer);
          }, 500);
        }
        
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
      
      // Recovery mechanism
      const nextIndex = currentPlayerIndex + 1;
      if (nextIndex < players.length) {
        // Force basic state update as fallback
        setCurrentPlayerIndex(nextIndex);
        setSelectedPlayer(players[nextIndex]);
        setCurrentBid(players[nextIndex].basePrice || 0.1);
        setBidHistory([]);
        setRemainingTime(30);
        startAuctionTimer();
      }
      
      toast({
        title: "Error",
        description: "An error occurred while moving to the next player. Attempting to recover.",
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
    if (!isWalletConnected || remainingTime <= 0 || paymentPending) {
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
        playerId: String(selectedPlayer.name),
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
        auctionStatus={finalAuctionStatus}
        moderatorMessage={`Bidding for ${selectedPlayer?.name || "Player"}`}
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
        isPaid={isPaid}
        isAuctionFinalized={isAuctionFinalized}
        onPayFinalizedAmount={handleUserPayment}
        isProcessingPayment={isProcessingPayment}
        isCurrentUserWinner={!!isCurrentUserWinner}
        ownedNFTs={ownedPlayerNFTs}
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
          {isWalletConnected && selectedPlayer && remainingTime > 0 && !isAuctionFinalized && !paymentPending && (
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

