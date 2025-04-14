"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIAgentProfile, AIAgentProfileOutput } from '@/ai/flows/ai-agent-profiles';
import { aiBiddingStrategy, AiBiddingStrategyOutput } from '@/ai/flows/ai-bidding-strategy';
import { getPlayerRecommendations, PlayerRecommendationsOutput } from '@/ai/flows/player-recommendations';
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlayerInfo, PlayerInfo, getAllPlayers, getShuffledPlayers } from "@/services/player-info";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ethers } from 'ethers';
import { Icons } from "@/components/icons";
import { playSpeech } from "@/services/tts-service";
import { Volume2, VolumeX, RotateCw } from "lucide-react";
import { MONAD_CONFIG, MICRO_MONAD, formatMonadAmount, connectToMonadTestnet, sendModeratedTransaction, formatAddress, checkSufficientGasFunds, connectAuctionWallet } from "@/lib/monad-utils";

// Monad Network Configuration - Updated with constants from monad-utils.ts
const MONAD_TESTNET_CHAIN_ID = MONAD_CONFIG.chainId;
const MONAD_TESTNET_NAME = MONAD_CONFIG.chainName;
const MONAD_TESTNET_RPC_URL = MONAD_CONFIG.rpcUrls[0];
const MONAD_TESTNET_EXPLORER = MONAD_CONFIG.blockExplorerUrls[0];
const CURRENCY_SYMBOL = MONAD_CONFIG.nativeCurrency.symbol;

// Moderator address for transaction approval
const MODERATOR_ADDRESS = "0x9876543210987654321098765432109876543210"; // Update with your actual moderator address
const MIN_BID_AMOUNT = MICRO_MONAD; // Using the very small amount as specified (0.0001 MONAD)

interface ModeratorControlsType {
  auctionStatus: string;
  message: string;
  recommendation: string;
}

interface TeamComposition {
  name: string;
  role: string;
  stats: {
    battingAverage: number;
    economy: number;
  };
  imageUrl: string;
}

interface AgentWallet {
  balance: number;
  tokens: number;
  playersOwned: string[];
}

const AuctionPage = () => {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | undefined>(undefined);
  const [playerQueue, setPlayerQueue] = useState<PlayerInfo[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  const [moderatorControls, setModeratorControls] = useState<ModeratorControlsType>({
    auctionStatus: "Not Started",
    message: "Welcome to the player auction! Connect your wallet to begin.",
    recommendation: ""
  });

  const [aiAgentBids, setAiAgentBids] = useState<{ [agentId: string]: number }>({
    mumbai_indians: 0,
    chennai_super_kings: 0,
    royal_challengers_bangalore: 0,
    kolkata_knight_riders: 0,
  });

  const [aiAgentWallets, setAiAgentWallets] = useState<{ [agentId: string]: AgentWallet }>({
    mumbai_indians: { balance: 10000, tokens: 0, playersOwned: [] },
    chennai_super_kings: { balance: 10000, tokens: 0, playersOwned: [] },
    royal_challengers_bangalore: { balance: 10000, tokens: 0, playersOwned: [] },
    kolkata_knight_riders: { balance: 10000, tokens: 0, playersOwned: [] },
  });

  const [aiAgentProfiles, setAiAgentProfiles] = useState<{ [agentId: string]: AIAgentProfileOutput }>({
    mumbai_indians: { agentName: "Mumbai Indians", strategyType: "balanced", description: "Known for their strategic player acquisitions and building a strong core team." },
    chennai_super_kings: { agentName: "Chennai Super Kings", strategyType: "balanced", description: "Focuses on experienced players and maintaining a balanced team composition." },
    royal_challengers_bangalore: { agentName: "Royal Challengers Bangalore", strategyType: "aggressive", description: "Known for aggressive bidding on star players to create a high-profile team." },
    kolkata_knight_riders: { agentName: "Kolkata Knight Riders", strategyType: "smart", description: "Focuses on identifying undervalued players and building a versatile squad." },
  });

  const [teamCompositions, setTeamCompositions] = useState<{ [agentId: string]: TeamComposition }>({
    mumbai_indians: {
      name: "",
      role: "",
      stats: { battingAverage: 0, economy: 0 },
      imageUrl: ""
    },
    chennai_super_kings: {
      name: "",
      role: "",
      stats: { battingAverage: 0, economy: 0 },
      imageUrl: ""
    },
    royal_challengers_bangalore: {
      name: "",
      role: "",
      stats: { battingAverage: 0, economy: 0 },
      imageUrl: ""
    },
    kolkata_knight_riders: {
      name: "",
      role: "",
      stats: { battingAverage: 0, economy: 0 },
      imageUrl: ""
    },
  });

  const [aiPlayerRecommendations, setAiPlayerRecommendations] = useState<PlayerRecommendationsOutput>({
    recommendations: [],
  });

  const { toast } = useToast()

  const [manualBidAmount, setManualBidAmount] = useState<number>(0);
  const [biddingCooldown, setBiddingCooldown] = useState<number>(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("player1");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasWeb3Provider, setHasWeb3Provider] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [etherBalance, setEtherBalance] = useState<string | null>("0");
  const [userTokens, setUserTokens] = useState<number>(0);
  const [userWalletBalance, setUserWalletBalance] = useState<number>(10000);
  const [ownedNFTs, setOwnedNFTs] = useState<string[]>([]);
  const [aiModeratorIsThinking, setAiModeratorIsThinking] = useState<boolean>(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(true);
  const previousMessageRef = useRef<string>("");
  const [shouldAutoStart, setShouldAutoStart] = useState<boolean>(true);

  const [autoSellTimeout, setAutoSellTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoSellCountdown, setAutoSellCountdown] = useState<number>(0);
  const AUTO_SELL_COUNTDOWN = 20; // seconds
  const AUTO_SELL_BIDS_THRESHOLD = 3;
  const [bidsSinceLastHighest, setBidsSinceLastHighest] = useState<number>(0);

  const [showNetworkConfigDialog, setShowNetworkConfigDialog] = useState<boolean>(false);
  const [showInsufficientFundsDialog, setShowInsufficientFundsDialog] = useState<boolean>(false);
  const [gasFundsInfo, setGasFundsInfo] = useState<{
    balance: string;
    minimumRequired: string;
  }>({ balance: "0", minimumRequired: "0.001" });

  const fetchOwnedNFTs = async (address: string) => {
    try {
      // This is a mock implementation since we don't have a real NFT contract yet
      // In a real implementation, we would query the blockchain for owned NFTs
      console.log("Fetching owned NFTs for address:", address);
      
      // For demo purposes, let's assume the user has some NFTs already
      const mockNFTs = ["Virat Kohli", "MS Dhoni"];
      setOwnedNFTs(mockNFTs);
      
      return mockNFTs;
    } catch (error) {
      console.error("Error fetching owned NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your owned NFTs.",
        variant: "destructive",
      });
      return [];
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Use the new connectAuctionWallet function specifically for auction
        const result = await connectAuctionWallet();
        
        if (!result.success) {
          throw new Error(result.error || "Failed to connect auction wallet");
        }
        
        const { address, provider, signer, balance } = result;
        
        if (!address || !provider || !signer) {
          throw new Error("Missing connection data");
        }
        
        setAccount(address);
        setWalletAddress(address);
        setHasWeb3Provider(true);

        // Set balance from connectAuctionWallet result
        setEtherBalance(balance || "0");
        
        // Use the actual wallet balance instead of a fixed value
        setUserWalletBalance(parseFloat(balance || "0"));

        setModeratorControls(prev => ({
          ...prev,
          message: `Welcome ${formatAddress(address)}! Connected to Monad Testnet for auction transactions. You have ${CURRENCY_SYMBOL}${balance || "0"} MON available for bidding.`
        }));

        toast({
          title: "Wallet Connected for Auction",
          description: `Connected with wallet: ${formatAddress(address)}`,
        });
        
        await fetchOwnedNFTs(address);
      } else {
        toast({
          title: "No Web3 Provider Detected",
          description: "Please install Metamask or another Web3 provider to connect to Monad Testnet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "There was an error connecting to your wallet: " + (error.message || "Please try again."),
        variant: "destructive",
      });
    }
  };

  const updateModeratorWithSpeech = useCallback(
    (updates: Partial<ModeratorControlsType>) => {
      setModeratorControls((prev) => ({
        ...prev,
        ...updates,
      }));

      // Play speech if TTS is enabled and message has changed
      if (
        isTTSEnabled &&
        updates.message &&
        updates.message !== previousMessageRef.current
      ) {
        previousMessageRef.current = updates.message;
        playSpeech(updates.message);
      }
    },
    [isTTSEnabled]
  );

  const moveToNextPlayer = useCallback(() => {
    const nextIndex = (currentPlayerIndex + 1) % playerQueue.length;
    setCurrentPlayerIndex(nextIndex);
    setPlayerInfo(playerQueue[nextIndex]);
    setCurrentPlayerId(playerQueue[nextIndex].playerId);
    
    // Reset auction state for the new player
    setBidsSinceLastHighest(0);
    setAutoSellCountdown(AUTO_SELL_COUNTDOWN);
    setAiAgentBids({
      mumbai_indians: 0,
      chennai_super_kings: 0,
      royal_challengers_bangalore: 0,
      kolkata_knight_riders: 0,
    });
    
    updateModeratorWithSpeech({
      auctionStatus: "Not Started",
      message: `${playerQueue[nextIndex].name} is up for auction! Get ready to bid.`,
      recommendation: `${playerQueue[nextIndex].role} with a base price of ${CURRENCY_SYMBOL}${playerQueue[nextIndex].basePrice.toLocaleString()}.`
    });
    
    setShouldAutoStart(true);
  }, [playerQueue, currentPlayerIndex, updateModeratorWithSpeech]);

  const mintPlayerNFT = async (buyer: string, playerId: string) => {
    try {
      // Check if we have a valid wallet connection
      if (!account) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to mint NFTs.",
          variant: "destructive",
        });
        return;
      }
      
      const message = `Preparing to mint NFT for ${playerInfo?.name || 'this player'} to ${buyer}`;
      updateModeratorWithSpeech({
        message,
        recommendation: "This will create a blockchain transaction on Monad testnet."
      });
      
      // Send transaction to moderator
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        // Check if user has enough MON for gas fees
        const signerAddress = await signer.getAddress();
        const { sufficient, balance, minimumRequired } = await checkSufficientGasFunds(provider, signerAddress);
        
        if (!sufficient) {
          // Show insufficient funds dialog
          setGasFundsInfo({
            balance,
            minimumRequired
          });
          setShowInsufficientFundsDialog(true);
          
          updateModeratorWithSpeech({
            message: `Not enough MON for NFT minting transaction. Current balance: ${balance} MON.`,
            recommendation: "Please obtain testnet MON tokens from the Monad faucet to continue."
          });
          
          return;
        }
        
        updateModeratorWithSpeech({
          message: `Minting NFT for ${playerInfo?.name || 'this player'}. Amount: ${MIN_BID_AMOUNT} ${CURRENCY_SYMBOL}`,
          recommendation: "Please approve the transaction in your MetaMask wallet."
        });
        
        // Use the moderator function from monad-utils
        const result = await sendModeratedTransaction(
          signer,
          buyer,
          MIN_BID_AMOUNT,
          MODERATOR_ADDRESS
        );
        
        if (result.success) {
          toast({
            title: "NFT Minted Successfully",
            description: `Player NFT minted for ${MIN_BID_AMOUNT} ${CURRENCY_SYMBOL} and transferred to ${formatAddress(buyer)}. Tx: ${result.txHash?.substring(0, 6)}...`,
          });
          
          if (buyer === account) {
            setOwnedNFTs(prev => [...prev, playerInfo?.name || 'New Player']);
            setUserTokens(prev => prev + 1);
          } else {
            const agentId = Object.keys(aiAgentProfiles).find(id => 
              aiAgentProfiles[id].agentName === buyer
            );
            
            if (agentId) {
              setAiAgentWallets(prev => ({
                ...prev,
                [agentId]: {
                  ...prev[agentId],
                  tokens: prev[agentId].tokens + 1,
                  playersOwned: [...prev[agentId].playersOwned, playerInfo?.name || 'New Player']
                }
              }));
            }
          }
          
          const successMessage = `Congratulations to ${formatAddress(buyer)} on acquiring ${playerInfo?.name || 'this player'} for ${MIN_BID_AMOUNT} ${CURRENCY_SYMBOL}!`;
          const recommendation = `The NFT has been minted and transferred. Transaction hash: ${result.txHash?.substring(0, 10)}...`;
          
          updateModeratorWithSpeech({
            message: successMessage,
            recommendation
          });
          
          setTimeout(() => {
            moveToNextPlayer();
          }, 5000);
        }
      } else {
        toast({
          title: "No Web3 Provider Detected",
          description: "Please install Metamask or another Web3 provider to connect to Monad Testnet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Minting Failed",
        description: "There was an error minting the NFT: " + (error.message || "Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleManualBid = async () => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place a bid.",
        variant: "destructive",
      });
      return;
    }

    if (!playerInfo) {
      toast({
        title: "No Player Selected",
        description: "There is no player currently up for auction.",
        variant: "destructive",
      });
      return;
    }

    let bidAmount = Number(manualBidAmount);
    if (!bidAmount || isNaN(bidAmount)) {
      // Default bid amount calculation if none specified
      bidAmount = (playerInfo.currentBid || playerInfo.basePrice) * 1.1;
      bidAmount = Math.round(bidAmount * 100) / 100; // Round to 2 decimal places
      setManualBidAmount(bidAmount);
    }
    
    if (bidAmount <= (playerInfo.currentBid || playerInfo.basePrice)) {
      toast({
        title: "Bid Too Low",
        description: `Please enter a bid higher than the current bid of ${CURRENCY_SYMBOL}${playerInfo.currentBid || playerInfo.basePrice}.`,
        variant: "destructive",
      });
      return;
    }

    if (bidAmount > userWalletBalance) {
      toast({
        title: "Insufficient Funds",
        description: `You don't have enough balance to place this bid. Your balance: ${CURRENCY_SYMBOL}${userWalletBalance}`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Placing bid:", bidAmount);
      
      const isNewHighest = bidAmount > (playerInfo.currentBid || playerInfo.basePrice);
      
      // Send through moderator
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        // Check if user has enough MON for gas fees
        const signerAddress = await signer.getAddress();
        const { sufficient, balance, minimumRequired } = await checkSufficientGasFunds(provider, signerAddress);
        
        if (!sufficient) {
          // Show insufficient funds dialog
          setGasFundsInfo({
            balance,
            minimumRequired
          });
          setShowInsufficientFundsDialog(true);
          
          updateModeratorWithSpeech({
            message: `You don't have enough MON for transaction fees. Current balance: ${balance} MON.`,
            recommendation: "Please obtain testnet MON tokens from the Monad faucet to continue."
          });
          
          return;
        }
        
        updateModeratorWithSpeech({
          message: `Processing your bid of ${CURRENCY_SYMBOL}${bidAmount}...`,
          recommendation: "Transaction is being sent to the Monad testnet. Please approve in MetaMask."
        });
        
        // Use the moderator function from monad-utils
        const result = await sendModeratedTransaction(
          signer,
          MODERATOR_ADDRESS,  // Moderator address as recipient for bids
          MIN_BID_AMOUNT,     // Only send MIN_BID_AMOUNT per transaction
          MODERATOR_ADDRESS
        );
        
        if (!result.success) {
          throw new Error(result.error || "Transaction failed");
        }
        
        // Update UI state after transaction is approved
        setPlayerInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBid: bidAmount,
            currentBidder: account!,
          };
        });
        
        setUserWalletBalance(prev => prev - bidAmount);
        
        setAutoSellCountdown(AUTO_SELL_COUNTDOWN);
        
        if (isNewHighest) {
          setBidsSinceLastHighest(0);
        } else {
          setBidsSinceLastHighest(prev => prev + 1);
        }
        
        setAiModeratorIsThinking(true);
        setTimeout(() => {
          setAiModeratorIsThinking(false);
          const message = `Bid of ${CURRENCY_SYMBOL}${bidAmount} from ${account?.substring(0, 6)}...${account?.substring(account.length - 4)} accepted! Transaction confirmed on Monad testnet.`;
          const recommendation = `This is a strong bid! The AI moderator will automatically sell the player ${isNewHighest ? "if no higher bids are received." : "soon as bidding slows down."} Transaction hash: ${result.txHash?.substring(0, 10)}...`;
          
          updateModeratorWithSpeech({
            message,
            recommendation
          });
        }, 1500);
        
        toast({
          title: "Bid Placed Successfully",
          description: `You have placed a bid for ${CURRENCY_SYMBOL}${bidAmount}! Transaction confirmed. Tx: ${result.txHash?.substring(0, 6)}...`,
        });
        
        setManualBidAmount(0);
      } else {
        throw new Error("MetaMask is not installed");
      }
    } catch (error: any) {
      console.error("Error placing manual bid:", error);
      
      // Check if the error is related to gas fees
      const errorMessage = error.message?.toLowerCase() || "";
      if (
        errorMessage.includes("insufficient funds") || 
        errorMessage.includes("gas") ||
        errorMessage.includes("fee")
      ) {
        if (typeof window !== 'undefined' && (window as any).ethereum && account) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const balance = await provider.getBalance(account);
          
          setGasFundsInfo({
            balance: ethers.formatEther(balance),
            minimumRequired: "0.001"
          });
          setShowInsufficientFundsDialog(true);
        }
      } else {
        toast({
          title: "Bid Failed",
          description: "There was an error placing your bid: " + (error.message || "Please try again."),
          variant: "destructive",
        });
      }
    }
  };

  const startAuction = () => {
    if (!account) {
      toast({
        title: "Authentication Required",
        description: "Please connect your MetaMask wallet to start the auction.",
        variant: "destructive",
      });
      return;
    }
    
    const basePrice = (playerInfo?.basePrice || 0) / 100;
    
    if (playerInfo) {
      setPlayerInfo(prev => ({
        ...prev!,
        basePrice: basePrice,
        currentBid: basePrice
      }));
    }
    
    const message = "The auction has begun! AI moderator will manage the bidding process and determine when to sell.";
    const recommendation = `Starting bids at ${CURRENCY_SYMBOL}${basePrice} for ${playerInfo?.name || 'this player'}.`;
    
    updateModeratorWithSpeech({
      auctionStatus: "In Progress",
      message,
      recommendation
    });
    
    toast({
      title: "Auction Started",
      description: "The auction has begun! Place your bids.",
    });
    
    setAiModeratorIsThinking(true);
    setBidsSinceLastHighest(0);
    setAutoSellCountdown(AUTO_SELL_COUNTDOWN);
    
    setTimeout(() => {
      setAiModeratorIsThinking(false);
      const newRecommendation = `This player would be a valuable addition for teams looking to strengthen their ${playerInfo?.role || 'lineup'}. I'll automatically sell when bidding slows down.`;
      
      updateModeratorWithSpeech({
        recommendation: newRecommendation
      });
    }, 3000);
  };

  useEffect(() => {
    if (moderatorControls.auctionStatus !== "In Progress" || autoSellCountdown <= 0) return;
    
    const timerId = setTimeout(() => {
      setAutoSellCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [autoSellCountdown, moderatorControls.auctionStatus]);

  useEffect(() => {
    if (moderatorControls.auctionStatus !== "In Progress" || !playerInfo) return;
    
    if (playerInfo.currentBidder && playerInfo.currentBid !== undefined && playerInfo.currentBid > 0) {
      setAiModeratorIsThinking(true);
      
      setTimeout(() => {
        setAiModeratorIsThinking(false);
        
        const message = `Bidding appears to have slowed down. ${playerInfo.name} will be sold to ${playerInfo.currentBidder} for ${CURRENCY_SYMBOL}${playerInfo.currentBid}.`;
        const recommendation = "Finalizing the sale in 5 seconds...";
        
        updateModeratorWithSpeech({
          message,
          recommendation
        });
        
        setTimeout(() => {
          const finalMessage = `${playerInfo.name} has been sold to ${playerInfo.currentBidder} for ${CURRENCY_SYMBOL}${playerInfo.currentBid}!`;
          
          updateModeratorWithSpeech({
            auctionStatus: "Completed",
            message: finalMessage,
            recommendation: "The NFT is being minted and transferred to the buyer's wallet."
          });
          
          toast({
            title: "Player Sold!",
            description: finalMessage,
          });
          
          if (playerInfo.currentBidder) {
            mintPlayerNFT(playerInfo.currentBidder, currentPlayerId);
          } else {
            console.error("Cannot mint NFT: No current bidder defined");
            toast({
              title: "Minting Failed",
              description: "Could not mint NFT due to missing bidder information.",
              variant: "destructive",
            });
          }
        }, 5000);
      }, 1000);
    }
  }, [autoSellCountdown, bidsSinceLastHighest, playerInfo, moderatorControls.auctionStatus, updateModeratorWithSpeech, currentPlayerId, mintPlayerNFT]);

  useEffect(() => {
    let cooldownInterval: NodeJS.Timeout;
    
    if (biddingCooldown > 0) {
      cooldownInterval = setInterval(() => {
        setBiddingCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => clearInterval(cooldownInterval);
  }, [biddingCooldown]);

  useEffect(() => {
    let isMounted = true;

    const fetchAIAgentProfiles = async () => {
      const agentIds = ['mumbai_indians', 'chennai_super_kings', 'royal_challengers_bangalore', 'kolkata_knight_riders'];
      const profiles: { [agentId: string]: AIAgentProfileOutput } = {};
      for (const agentId of agentIds) {
        const profile = await getAIAgentProfile({ agentId });
        if (isMounted) {
          profiles[agentId] = profile;
        }
      }
      if (isMounted) {
        setAiAgentProfiles(profiles);
      }
    };

    const fetchAIPlayerRecommendations = async () => {
      const recommendations = await getPlayerRecommendations({ userId: 'user1', budget: 10000 });
      if (isMounted) {
        setAiPlayerRecommendations(recommendations);
      }
    };

    fetchAIAgentProfiles();
    fetchAIPlayerRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await getShuffledPlayers();
        
        if (players.length > 0) {
          setPlayerQueue(players);
          setPlayerInfo(players[0]);
          setCurrentPlayerId(players[0].playerId);
          
          setModeratorControls(prev => ({
            ...prev,
            message: `${players[0].name} is up for auction! Get ready to bid.`,
            recommendation: `${players[0].role} with a base price of ${CURRENCY_SYMBOL}${players[0].basePrice.toLocaleString()}.`
          }));
        }
      } catch (error) {
        console.error("Error loading players:", error);
        toast({
          title: "Error",
          description: "Failed to load player data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    loadPlayers();
  }, []);

  useEffect(() => {
    if (account && shouldAutoStart && playerInfo && moderatorControls.auctionStatus === "Not Started") {
      const timer = setTimeout(() => {
        startAuction();
        setShouldAutoStart(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [account, playerInfo, moderatorControls.auctionStatus, shouldAutoStart]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        IPL Player NFT Auction <span className="text-purple-600">(Monad Testnet)</span>
      </h1>
      
      {!account && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto w-full max-w-md flex justify-center items-center z-[9999]">
          <Button 
            onClick={connectWallet} 
            className="bg-purple-600 hover:bg-purple-700 text-white text-xl px-8 py-8 shadow-xl animate-pulse"
            style={{ fontSize: '24px', minWidth: '300px' }}
          >
            CONNECT WALLET
          </Button>
        </div>
      )}
      
      <Card className="mb-4 border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monad Testnet Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasWeb3Provider ? (
            <Alert variant="destructive">
              <AlertTitle>Web3 Provider Required</AlertTitle>
              <AlertDescription>
                Please install a Web3 provider like Metamask to connect to Monad Testnet and participate in the auction.
              </AlertDescription>
            </Alert>
          ) : !account ? (
            <div className="flex flex-col space-y-2">
              <p className="text-sm mb-2">Connect your wallet to the Monad Testnet to participate in the player auction.</p>
              <Button onClick={connectWallet} className="w-full md:w-auto">
                Connect to Monad Testnet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="text-sm">
                Connected with wallet: {account}
              </div>
              <div className="text-sm">
                Network: <Badge variant="outline" className="ml-1">Monad Testnet</Badge>
              </div>
              <div className="text-sm">
                Monad Balance: {etherBalance ? etherBalance : "0"} MON
              </div>
              <div className="text-sm">
                Auction Credits: {CURRENCY_SYMBOL}{userWalletBalance.toLocaleString()}
              </div>
              <div className="text-sm">
                Player Tokens: {userTokens}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4 border-2 border-blue-300">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-2">
                <AvatarImage src="https://ui-avatars.com/api/?name=AI+Moderator&background=0D8ABC&color=fff" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">AI Auction Moderator</CardTitle>
                <CardDescription>
                  {aiModeratorIsThinking ? "Analyzing..." : "Ready to assist"}
                </CardDescription>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsTTSEnabled(!isTTSEnabled)}
              title={isTTSEnabled ? "Mute voice" : "Enable voice"}
            >
              {isTTSEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiModeratorIsThinking ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <p className="mb-2">{moderatorControls.message}</p>
              {moderatorControls.recommendation && (
                <p className="text-sm italic text-gray-600">{moderatorControls.recommendation}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {account && hasWeb3Provider ? (
        <>
          <Card className="mb-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {playerInfo ? playerInfo.name : <Skeleton className="h-6 w-40" />}
                  </CardTitle>
                  <CardDescription>
                    {playerInfo ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="mr-1">{playerInfo.role}</Badge>
                        {playerInfo.nationality && (
                          <span className="text-sm">{playerInfo.nationality}</span>
                        )}
                        {playerInfo.age && (
                          <span className="text-sm">{playerInfo.age} years</span>
                        )}
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-32" />
                    )}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-2 py-1 border border-purple-500 text-purple-700">
                  Player NFT
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-shrink-0">
                  {playerInfo ? (
                    <div className="relative group">
                      <Avatar className="h-60 w-60 rounded-lg">
                        <AvatarImage
                          src={playerInfo.imageUrl}
                          alt={playerInfo.name}
                          className="rounded-lg object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(playerInfo.name);
                          }}
                        />
                        <AvatarFallback className="rounded-lg">{playerInfo.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      {playerInfo.previousTeam && (
                        <Badge className="absolute bottom-2 left-2 bg-black/70">
                          {playerInfo.previousTeam}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Skeleton className="h-60 w-60 rounded-lg" />
                  )}
                </div>

                <div className="flex-grow space-y-4">
                  {playerInfo ? (
                    <div className="grid grid-cols-2 gap-2">
                      {playerInfo.stats.matches && (
                        <div className="bg-gray-100 p-2 rounded-md">
                          <div className="text-xs text-gray-500">Matches</div>
                          <div className="font-semibold">{playerInfo.stats.matches}</div>
                        </div>
                      )}
                      {playerInfo.stats.runs && (
                        <div className="bg-gray-100 p-2 rounded-md">
                          <div className="text-xs text-gray-500">Runs</div>
                          <div className="font-semibold">{playerInfo.stats.runs}</div>
                        </div>
                      )}
                      {playerInfo.stats.strikeRate && (
                        <div className="bg-gray-100 p-2 rounded-md">
                          <div className="text-xs text-gray-500">Strike Rate</div>
                          <div className="font-semibold">{playerInfo.stats.strikeRate}</div>
                        </div>
                      )}
                      {playerInfo.stats.wickets && (
                        <div className="bg-gray-100 p-2 rounded-md">
                          <div className="text-xs text-gray-500">Wickets</div>
                          <div className="font-semibold">{playerInfo.stats.wickets}</div>
                        </div>
                      )}
                      <div className="bg-gray-100 p-2 rounded-md">
                        <div className="text-xs text-gray-500">Batting Avg</div>
                        <div className="font-semibold">{playerInfo.stats.battingAverage}</div>
                      </div>
                      {playerInfo.stats.economy > 0 && (
                        <div className="bg-gray-100 p-2 rounded-md">
                          <div className="text-xs text-gray-500">Economy</div>
                          <div className="font-semibold">{playerInfo.stats.economy}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  
                  {playerInfo?.specialty && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-xs text-blue-600 mb-1">Player Specialty</div>
                      <div className="text-sm">{playerInfo.specialty}</div>
                    </div>
                  )}
                  
                  {playerInfo && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between">
                        <Badge className="mr-2">Base Price: {CURRENCY_SYMBOL}{playerInfo.basePrice.toLocaleString()}</Badge>
                        <Badge variant="secondary">Current Bid: {CURRENCY_SYMBOL}{(playerInfo.currentBid || 0).toLocaleString()}</Badge>
                      </div>
                      <div className="text-sm">Current Bidder: {playerInfo.currentBidder || "None"}</div>
                      
                      {moderatorControls.auctionStatus === "In Progress" && (
                        <div className="mt-2 flex items-center gap-2">
                          {biddingCooldown > 0 ? (
                            <div className="text-sm font-semibold text-amber-600">
                              AI teams are thinking... {biddingCooldown}s
                            </div>
                          ) : autoSellCountdown > 0 ? (
                            <div className="text-sm font-semibold text-red-600">
                              Auto-selling in {autoSellCountdown}s unless new bids arrive
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>
                IPL Team Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(aiAgentProfiles).map(([agentId, profile]) => (
                  <Card key={agentId} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Badge className="mb-1">{profile.strategyType}</Badge>
                      <CardTitle className="text-lg">
                        {profile.agentName}
                      </CardTitle>
                      <CardDescription>
                        {profile.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium">
                        <strong>Bid Amount: {CURRENCY_SYMBOL}{aiAgentBids[agentId] || 0}</strong>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-green-600">Balance: {CURRENCY_SYMBOL}{aiAgentWallets[agentId].balance}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 pt-2 pb-2">
                      <div className="text-xs">
                        <span className="font-semibold">Player Tokens: {aiAgentWallets[agentId].tokens}</span>
                        {aiAgentWallets[agentId].playersOwned.length > 0 && (
                          <div className="mt-1">
                            Owned Players: {aiAgentWallets[agentId].playersOwned.join(", ")}
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {ownedNFTs.length > 0 && (
            <Card className="mt-4 mb-4">
              <CardHeader>
                <CardTitle>
                  Your Player NFT Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ownedNFTs.map((nft, index) => (
                    <Badge key={index} className="px-3 py-1">
                      {nft}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="fixed bottom-6 left-0 right-0 mx-auto w-full max-w-md flex justify-center items-center z-[9999]">
            <div className="bg-gray-900 p-4 rounded-lg shadow-xl border-2 border-purple-500 flex flex-wrap gap-3 justify-center">
              {moderatorControls.auctionStatus !== "In Progress" && moderatorControls.auctionStatus !== "Completed" && (
                <Button 
                  onClick={startAuction} 
                  className="bg-green-600 hover:bg-green-700 rounded-full text-md px-6 py-3 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Start Auction
                </Button>
              )}
              
              {moderatorControls.auctionStatus === "In Progress" && (
                <div className="flex items-center gap-2 justify-center">
                  <Input
                    type="number"
                    placeholder={`Min bid: ${CURRENCY_SYMBOL}${Math.ceil((playerInfo?.currentBid || 0) * 1.1)}`}
                    min={(playerInfo?.currentBid || 0) + 1}
                    value={manualBidAmount || ""}
                    onChange={(e) => setManualBidAmount(Number(e.target.value))}
                    className="w-36 bg-gray-800 text-white border-purple-500"
                  />
                  <Button 
                    onClick={handleManualBid} 
                    className="bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Bid
                  </Button>
                </div>
              )}
              
              {moderatorControls.auctionStatus === "Completed" && (
                <Button
                  onClick={moveToNextPlayer}
                  className="bg-green-600 hover:bg-green-700 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Next Player
                </Button>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Insufficient Funds Dialog */}
      <Dialog open={showInsufficientFundsDialog} onOpenChange={setShowInsufficientFundsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Insufficient MON for Network Fees</DialogTitle>
            <DialogDescription>
              You don't have enough MON in your account to pay for network fees.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTitle>Transaction Failed</AlertTitle>
              <AlertDescription>
                Your wallet has {gasFundsInfo.balance} MON but you need at least {gasFundsInfo.minimumRequired} MON to complete transactions.
              </AlertDescription>
            </Alert>
            
            <div className="border-t pt-4 border-b pb-4">
              <h3 className="font-medium mb-2">How to get MON for Monad Testnet:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Visit the <a href="https://faucet.monad.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">Monad Testnet Faucet</a></li>
                <li>Enter your wallet address: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account}</code></li>
                <li>Complete any verification steps required by the faucet</li>
                <li>Receive MON tokens in your wallet (may take a few minutes)</li>
              </ol>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Your Wallet Address:</div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account}</code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (account) {
                      navigator.clipboard.writeText(account);
                      toast({
                        title: "Address Copied",
                        description: "Wallet address copied to clipboard",
                      });
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between mt-4">
            <a 
              href="https://faucet.monad.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
            >
              Visit Monad Faucet
            </a>
            <div>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowInsufficientFundsDialog(false)}
                className="mr-2"
              >
                Close
              </Button>
              <Button 
                type="button"
                onClick={async () => {
                  try {
                    if (typeof window !== 'undefined' && (window as any).ethereum && account) {
                      const provider = new ethers.BrowserProvider((window as any).ethereum);
                      const balance = await provider.getBalance(account);
                      setEtherBalance(ethers.formatEther(balance));
                      toast({
                        title: "Balance Updated",
                        description: `Your current balance is ${ethers.formatEther(balance)} MON`,
                      });
                    }
                  } catch (error) {
                    console.error("Error checking balance:", error);
                  }
                }}
              >
                Check Balance
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuctionPage;
