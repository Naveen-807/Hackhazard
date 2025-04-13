"use client";

import { useState, useEffect } from 'react';
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

interface ModeratorControlsType {
  auctionStatus: string;
}

const AuctionPage = () => {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({
    name: "Loading...",
    role: "Loading...",
    stats: { battingAverage: 0, economy: 0 },
    basePrice: 0,
    currentBid: 0,
    currentBidder: "None",
    imageUrl: "https://picsum.photos/200/300",
  });

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

  const startAuction = () => {
        setModeratorControls({ auctionStatus: "In Progress" });
        toast({
            title: "Auction Started",
            description: "The auction has begun! Bidding is now open.",
        });
        setIsTimerRunning(true);
    };

  const handleManualBid = () => {
    if (manualBidAmount > playerInfo.currentBid) {
      setPlayerInfo((prev) => ({
        ...prev,
        currentBid: manualBidAmount,
        currentBidder: "You",
      }));
      toast({
        title: "Bid Placed",
        description: `You have placed a bid for $${manualBidAmount}!`,
      });
    } else {
      toast({
        title: "Bid Too Low",
        description: "Please enter a bid higher than the current bid.",
        variant: "destructive",
      });
    }
  };

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
                description: `The bidding for ${playerInfo.name} is over.`,
            });
            // TODO: Implement logic to sell the player to the highest bidder
            // and push the next player for bidding
        }

        return () => clearInterval(timerInterval);
    }, [isTimerRunning, auctionTimer, playerInfo.name, toast]);

  useEffect(() => {
    // Simulate real-time updates and AI bidding
    const interval = setInterval(async () => {
      setPlayerInfo((prev) => ({
        ...prev,
        currentBid: prev.currentBid + 1000,
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
          currentBid: playerInfo.currentBid,
          basePrice: playerInfo.basePrice,
        };

        const bidDecision = await aiBiddingStrategy(biddingStrategyInput);
        if (bidDecision.bidDecision) {
          newBids[agentId] = bidDecision.bidAmount;
          setAiAgentBids((prev) => ({ ...prev, [agentId]: bidDecision.bidAmount }));
        } else {
          newBids[agentId] = 0;
        }
      }

      // Find the highest bidder among AI agents
      let highestBid = playerInfo.currentBid;
      let highestBidder = playerInfo.currentBidder;
      for (const agentId in newBids) {
        if (newBids[agentId] > highestBid) {
          highestBid = newBids[agentId];
          highestBidder = aiAgentProfiles[agentId].agentName;
        }
      }

      if (highestBid > playerInfo.currentBid) {
        setPlayerInfo((prev) => ({
          ...prev,
          currentBid: highestBid,
          currentBidder: highestBidder,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [aiAgentProfiles, playerInfo.basePrice, playerInfo.currentBid, playerInfo.currentBidder]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auction Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player Card */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>{playerInfo.name}</CardTitle>
            <CardDescription>{playerInfo.role}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
              <Avatar className="mb-4 h-32 w-32">
                  <AvatarImage src={playerInfo.imageUrl} alt={playerInfo.name} onError={(e) => {
                      e.currentTarget.src = "https://picsum.photos/200/300";
                  }}/>
                  <AvatarFallback>{playerInfo.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            <p>Batting Avg: {playerInfo.stats.battingAverage}</p>
            <p>Economy: {playerInfo.stats.economy}</p>
            <p>Base Price: ${playerInfo.basePrice}</p>
            <p>Current Bid: ${playerInfo.currentBid}</p>
            <p>Current Bidder: {playerInfo.currentBidder}</p>
              <p>Time Remaining: {auctionTimer} seconds</p>
            <div className="flex mt-4">
              <Input
                type="number"
                placeholder="Enter your bid"
                className="mr-2"
                value={manualBidAmount === 0 ? "" : manualBidAmount.toString()}
                onChange={(e) => setManualBidAmount(Number(e.target.value))}
              />
              <Button onClick={handleManualBid}>Place Bid</Button>
            </div>
          </CardContent>
        </Card>

        {/* Moderator Control Panel */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Moderator Controls</CardTitle>
            <CardDescription>Control the auction flow</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Auction Status: {moderatorControls.auctionStatus}</p>
            <div className="flex flex-col space-y-2">
              <Button onClick={startAuction} disabled={moderatorControls.auctionStatus === "In Progress"}>
                  Start Auction
              </Button>
              <Button>Pause Auction</Button>
              <Button>Resume Auction</Button>
              <Button>End Auction</Button>
              <Button>Next Player</Button>
              <Button variant="destructive">Override/Freeze Auction</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Bids Display */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">IPL Team Bids</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(aiAgentProfiles).map(([agentId, profile]) => (
            <Card key={agentId} className="bg-card">
              <CardHeader>
                <CardTitle>{profile.agentName}</CardTitle>
                <CardDescription>{profile.description}</CardDescription>
                <Badge>{profile.strategyType}</Badge>
              </CardHeader>
              <CardContent>
                <p>Bid Amount: ${aiAgentBids[agentId] || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Player Recommendations Display */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">AI Player Recommendations</h2>
        {aiPlayerRecommendations.recommendations.length > 0 ? (
          <ul>
            {aiPlayerRecommendations.recommendations.map((recommendation) => (
              <li key={recommendation.playerId}>
                {recommendation.playerId} - {recommendation.reason}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available.</p>
        )}
      </div>
    </div>
  );
};

export default AuctionPage;
