"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIAgentProfile, AIAgentProfileOutput } from '@/ai/flows/ai-agent-profiles';
import { aiBiddingStrategy, AiBiddingStrategyOutput } from '@/ai/flows/ai-bidding-strategy';
import { getPlayerRecommendations, PlayerRecommendationsOutput } from '@/ai/flows/player-recommendations';
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface PlayerInfoType {
  name: string;
  role: string;
  stats: { battingAverage: number; economy: number };
  basePrice: number;
  currentBid: number;
  currentBidder: string;
  imageUrl: string;
}

interface ModeratorControlsType {
  auctionStatus: string;
}

const AuctionPage = () => {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoType>({
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
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  });

  const [aiAgentProfiles, setAiAgentProfiles] = useState<{ [agentId: string]: AIAgentProfileOutput }>({
    agent1: { agentName: "Loading...", strategyType: "balanced", description: "Loading..." },
    agent2: { agentName: "Loading...", strategyType: "aggressive", description: "Loading..." },
    agent3: { agentName: "Loading...", strategyType: "smart", description: "Loading..." },
    agent4: { agentName: "Loading...", strategyType: "balanced", description: "Loading..." },
  });

  const [aiPlayerRecommendations, setAiPlayerRecommendations] = useState<PlayerRecommendationsOutput>({
    recommendations: [],
  });

  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true; // Add a flag to track component mount status

    // Fetch AI agent profiles
    const fetchAIAgentProfiles = async () => {
      const agentIds = ['agent1', 'agent2', 'agent3', 'agent4'];
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
    // Simulate real-time updates and AI bidding
    const interval = setInterval(async () => {
      setPlayerInfo((prev) => ({
        ...prev,
        currentBid: prev.currentBid + 1000,
      }));

      // Simulate AI bidding logic
      const agentIds = ['agent1', 'agent2', 'agent3', 'agent4'];
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
      let highestBid = 0;
      let highestBidder = "None";
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
  }, [aiAgentProfiles, playerInfo.basePrice, playerInfo.currentBid]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auction Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player Card */}
        <Card className="auction-primary">
          <CardHeader>
            <CardTitle>{playerInfo.name}</CardTitle>
            <CardDescription>{playerInfo.role}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <img
              src={playerInfo.imageUrl}
              alt={playerInfo.name}
              className="rounded-md mb-4"
              width="200"
              height="300"
            />
            <p>Batting Avg: {playerInfo.stats.battingAverage}</p>
            <p>Economy: {playerInfo.stats.economy}</p>
            <p>Base Price: ${playerInfo.basePrice}</p>
            <p>Current Bid: ${playerInfo.currentBid}</p>
            <p>Current Bidder: {playerInfo.currentBidder}</p>
            {/* TODO: Add bid timer */}
          </CardContent>
        </Card>

        {/* Moderator Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Moderator Controls</CardTitle>
            <CardDescription>Control the auction flow</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Auction Status: {moderatorControls.auctionStatus}</p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => toast({
                  title: "Auction Started",
                  description: "The auction has been started!",
                })}>Start Auction</Button>
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
        <h2 className="text-xl font-bold mb-2">AI Agent Bids</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(aiAgentProfiles).map(([agentId, profile]) => (
            <Card key={agentId}>
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
