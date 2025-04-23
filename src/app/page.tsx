"use client";

import { useEffect } from "react";
import AuctionPage from "@/components/AuctionPage";
import { getAllPlayers } from "@/services/player-service";

export default function Home() {
  // Debug check for player data
  useEffect(() => {
    const checkPlayerData = async () => {
      try {
        console.log("Checking player data availability...");
        const players = getAllPlayers();
        console.log("Players from service:", players);
        if (players.length === 0) {
          console.error("No players found in the database!");
        } else {
          console.log(`Found ${players.length} players. First player:`, players[0]);
        }
      } catch (error) {
        console.error("Error checking player data:", error);
      }
    };
    
    checkPlayerData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuctionPage />
    </main>
  );
}
