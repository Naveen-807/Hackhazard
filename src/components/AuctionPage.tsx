"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuctionPage = () => {
  const [playerInfo, setPlayerInfo] = useState({
    name: "Loading...",
    role: "Loading...",
    stats: { battingAverage: 0, economy: 0 },
    basePrice: 0,
    currentBid: 0,
    currentBidder: "None",
    imageUrl: "https://picsum.photos/200/300",
  });

  const [moderatorControls, setModeratorControls] = useState({
    auctionStatus: "Not Started",
  });

  useEffect(() => {
    // TODO: Replace with Firebase real-time data fetching
    // Simulate real-time updates
    const interval = setInterval(() => {
      setPlayerInfo((prev) => ({
        ...prev,
        currentBid: prev.currentBid + 1000,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auction Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player Card */}
        <Card>
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
              <Button>Start Auction</Button>
              <Button>Pause Auction</Button>
              <Button>Resume Auction</Button>
              <Button>End Auction</Button>
              <Button>Next Player</Button>
              <Button variant="destructive">Override/Freeze Auction</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuctionPage;
