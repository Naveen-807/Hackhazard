"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIAgentProfile, AIAgentProfileOutput } from '@/ai/flows/ai-agent-profiles';
import { aiBiddingStrategy, AiBiddingStrategyOutput } from '@/ai/flows/ai-bidding-strategy';
import { getPlayerRecommendations, PlayerRecommendationsOutput } from '@/ai/flows/player-recommendations';
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlayerInfo, PlayerInfo } from "@/services/player-info";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { Icons } from "@/components/icons";

// Contract addresses - your deployed contract addresses
const NFT_CONTRACT_ADDRESS = "0xf8e81D47203A594245E36C48e151709F0C19fBe8"; // AutomatedNFT
const AUTOMATOR_CONTRACT_ADDRESS = "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8"; // TransactionAutomator

interface ModeratorControlsType {
  auctionStatus: string;
}

const AuctionPage = () => {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | undefined>(undefined);

  const [moderatorControls, setModeratorControls] = useState<ModeratorControlsType>({
    auctionStatus: "Not Started",
  });

  const [aiAgentBids, setAiAgentBids] = useState<{ [agentId: string]: number }>({
    mumbai_indians: 0,
    chennai_super_kings: 0,
    royal_challengers_bangalore: 0,
    kolkata_knight_riders: 0,
  });

  const [aiAgentProfiles, setAiAgentProfiles] = useState<{ [agentId: string]: AIAgentProfileOutput }>({
    mumbai_indians: { agentName: "Mumbai Indians", strategyType: "balanced", description: "Known for their strategic player acquisitions and building a strong core team." },
    chennai_super_kings: { agentName: "Chennai Super Kings", strategyType: "balanced", description: "Focuses on experienced players and maintaining a balanced team composition." },
    royal_challengers_bangalore: { agentName: "Royal Challengers Bangalore", strategyType: "aggressive", description: "Known for aggressive bidding on star players to create a high-profile team." },
    kolkata_knight_riders: { agentName: "Kolkata Knight Riders", strategyType: "smart", description: "Focuses on identifying undervalued players and building a versatile squad." },
  });

  const [teamCompositions, setTeamCompositions] = useState<{ [agentId: string]: { name: string; role: string; stats: { battingAverage: number; economy: number }; imageUrl: string; } }>({
    mumbai_indians: {},
    chennai_super_kings: {},
    royal_challengers_bangalore: {},
    kolkata_knight_riders: {},
  });

  const [aiPlayerRecommendations, setAiPlayerRecommendations] = useState<PlayerRecommendationsOutput>({
    recommendations: [],
  });

  const { toast } = useToast()

  const [manualBidAmount, setManualBidAmount] = useState<number>(0);
  const [auctionTimer, setAuctionTimer] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("player1");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasWeb3Provider, setHasWeb3Provider] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [etherBalance, setEtherBalance] = useState<string | null>("0");

  // Function to connect to the user's wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);

        // Request account access if needed
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setWalletAddress(address);
        setHasWeb3Provider(true);

        const balance = await provider.getBalance(address);
        setEtherBalance(formatEther(balance));

        toast({
          title: "Wallet Connected",
          description: `Connected with wallet: ${address}`,
        });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast({
          title: "Connection Failed",
          description: "There was an error connecting to your wallet. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Web3 Provider Detected",
        description: "Please install Metamask or another Web3 provider.",
        variant: "destructive",
      });
    }
  };


  const startAuction = () => {
    setModeratorControls({ auctionStatus: "In Progress" });
    toast({
      title: "Auction Started",
      description: "The auction has begun! Bidding is now open.",
    });
    setIsTimerRunning(true);
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

    if ((manualBidAmount || 0) > (playerInfo?.currentBid || 0)) {
      try {
        // TODO: Implement the bidding transaction on the Web3 Monad testnet.
        // This involves signing and sending a transaction to the auction contract.
        // Example:
        // const transactionHash = await bidOnAuction(manualBidAmount);
        // setPlayerInfo((prev) => ({
        //     ...prev,
        //     currentBid: manualBidAmount,
        //     currentBidder: "You",
        // }));
        // toast({
        //     title: "Bid Placed",
        //     description: `You have placed a bid for $${manualBidAmount}! Transaction Hash: ${transactionHash}`,
        // });
        setPlayerInfo((prev) => ({
          ...prev!,
          currentBid: manualBidAmount,
          currentBidder: account,
        }));
        toast({
          title: "Bid Placed",
          description: `You have placed a bid for $${manualBidAmount}!`,
        });

      } catch (error) {
        console.error("Error placing manual bid:", error);
        toast({
          title: "Bid Failed",
          description: "There was an error placing your bid. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Bid Too Low",
        description: "Please enter a bid higher than the current bid.",
        variant: "destructive",
        });
    }
  };

  // Placeholder function for bidding on the auction (to be replaced with actual Web3 calls)
  const bidOnAuction = async (amount: number) => {
    // TODO: Implement the actual Web3 call to bid on the auction.
    // This function should sign and send a transaction to the smart contract.
    // Return the transaction hash upon successful submission.
    console.log(`Simulating bid of $${amount} on the Web3 Monad testnet.`);
    return '0xSimulatedTransactionHash'; // Replace with actual transaction hash
  };

  useEffect(() => {
    // Check if Web3 provider is available on mount
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      setHasWeb3Provider(true);
    }
  }, []);


  useEffect(() => {
    const fetchPlayerInfo = async () => {
      const player = await getPlayerInfo(currentPlayerId);
      if (player) {
        setPlayerInfo(player);
      } else {
        console.error("Failed to fetch player info for ID:", currentPlayerId);
      }
    };

    fetchPlayerInfo();
  }, [currentPlayerId]);

  useEffect(() => {
    let isMounted = true; // Add a flag to track component mount status

    // Fetch AI agent profiles
    const fetchAIAgentProfiles = async () => {
      const agentIds = ['mumbai_indians', 'chennai_super_kings', 'royal_challengers_bangalore', 'kolkata_knight_riders'];
      const profiles: { [agentId: string]: AIAgentProfileOutput } = {};
      for (const agentId of agentIds) {
        const profile = await getAIAgentProfile({ agentId });
        if (isMounted) { // Check if component is still mounted before setting state
          profiles[agentId] = profile;
        }
      }
      if (isMounted) {
        setAiAgentProfiles(profiles);
      }
    };

    const fetchAIPlayerRecommendations = async () => {
      const recommendations = await getPlayerRecommendations({ userId: 'user1', budget: 1000000 });
      if (isMounted) { // Check if component is still mounted before setting state
        setAiPlayerRecommendations(recommendations);
      }
    };

    fetchAIAgentProfiles();
    fetchAIPlayerRecommendations();

    return () => {
      isMounted = false; // Set the flag to false when component unmounts
    };
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isTimerRunning && auctionTimer > 0) {
      timerInterval = setInterval(() => {
        setAuctionTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (auctionTimer === 0) {
      setIsTimerRunning(false);
      toast({
        title: "Time's Up!",
        description: `The bidding for ${playerInfo?.name} is over.`,
      });
      // TODO: Implement logic to sell the player to the highest bidder
      // and push the next player for bidding
    }

    return () => clearInterval(timerInterval);
  }, [isTimerRunning, auctionTimer, playerInfo?.name, toast]);

  useEffect(() => {
    // Simulate real-time updates and AI bidding
    const interval = setInterval(async () => {
      setPlayerInfo((prev) => ({
        ...prev!,
        currentBid: (prev!.currentBid || 0) + 1000,
      }));

      // Simulate AI bidding logic
      const agentIds = ['mumbai_indians', 'chennai_super_kings', 'royal_challengers_bangalore', 'kolkata_knight_riders'];
      const newBids: { [agentId: string]: number } = {};

      for (const agentId of agentIds) {
        const profile = aiAgentProfiles[agentId];
        const biddingStrategyInput = {
          playerEvaluationScore: Math.random() * 10,
          agentStrategyType: profile.strategyType,
          teamNeedsScore: Math.random() * 10,
          remainingBudget: 500000,
          currentBid: playerInfo?.currentBid || 0,
          basePrice: playerInfo?.basePrice || 0,
        };

        const bidDecision = await aiBiddingStrategy(biddingStrategyInput);
        if (bidDecision.bidDecision) {
          newBids[agentId] = bidDecision.bidAmount;
          // AI agent places a bid transaction
          try {
            // TODO: Implement the bidding transaction on the Web3 Monad testnet for AI agents.
            // This involves signing and sending a transaction to the auction contract.
            // const transactionHash = await bidOnAuction(bidDecision.bidAmount);
            // setAiAgentBids((prev) => ({ ...prev, [agentId]: bidDecision.bidAmount }));
            // toast({
            //     title: "AI Bid Placed",
            //     description: `${profile.agentName} has placed a bid for $${bidDecision.bidAmount}! Transaction Hash: ${transactionHash}`,
            // });
            setAiAgentBids((prev) => ({ ...prev, [agentId]: bidDecision.bidAmount }));
            toast({
              title: "AI Bid Placed",
              description: `${profile.agentName} has placed a bid for $${bidDecision.bidAmount}!`,
            });
          } catch (error) {
            console.error("Error placing AI bid:", error);
            toast({
              title: "AI Bid Failed",
              description: `There was an error placing AI bid for ${profile.agentName}. Please check console.`,
              variant: "destructive",
            });
          }
        } else {
          newBids[agentId] = 0;
        }
      }

      // Find the highest bidder among AI agents
      let highestBid = playerInfo?.currentBid || 0;
      let highestBidder = playerInfo?.currentBidder || "None";
      for (const agentId in newBids) {
        if (newBids[agentId] > highestBid) {
          highestBid = newBids[agentId];
          highestBidder = aiAgentProfiles[agentId].agentName;
        }
      }

      if (highestBid > (playerInfo?.currentBid || 0)) {
        setPlayerInfo((prev) => ({
          ...prev!,
          currentBid: highestBid,
          currentBidder: highestBidder,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [aiAgentProfiles, playerInfo?.basePrice, playerInfo?.currentBid, playerInfo?.currentBidder, toast]);


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Auction Page
      </h1>
      {/* Connect Wallet Button */}
      {!hasWeb3Provider ? (
        <>
          <span>Web3 Provider Required</span>
          Please install a Web3 provider like Metamask to participate in the auction.
        </>
      ) : !account ? (
        
          Connect Wallet
        
      ) : (
        
          
            Connected with wallet: {account}
          
          Balance: {etherBalance ? etherBalance : "0"} ETH
        
      )}

      
        
          
            {playerInfo ? playerInfo.name : <Skeleton />}
          
          
            {playerInfo ? playerInfo.role : <Skeleton />}
          
          
            
              {playerInfo ? (
                <>
                  
                    <AvatarImage src={playerInfo.imageUrl} alt={playerInfo.name} onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/200/300";
                    }} />
                    
                  
                </>
              ) : (
                <Skeleton />
              )}
            
          
        
      

      
        
          IPL Team Bids
        
        
          {Object.entries(aiAgentProfiles).map(([agentId, profile]) => (
            
              
                
                  {profile.strategyType}
                  
                    {profile.agentName}
                  
                  
                    {profile.description}
                  
                
                
                  <strong>Bid Amount: ${aiAgentBids[agentId] || 0}</strong>
                
              
            
          ))}
        
      
    </div>
  );
};

export default AuctionPage;
