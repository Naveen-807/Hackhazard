// Define player information types for auction app

export interface PlayerStats {
  battingAverage?: number;
  strikeRate?: number;
  economyRate?: number;
  economy?: number; // alternative name for economyRate
  matchesPlayed?: number;
  totalRuns?: number;
  highestScore?: number | string;
  totalWickets?: number;
  bestBowlingFigures?: string;
  bowlingAverage?: number;
  wickets?: number;
  matches?: number;
}

export interface BasePlayerInfo {
  id: number | string;
  name: string;
  team?: string;
  role: string;
  stats: PlayerStats;
  image?: string;
  basePrice: number;
  age?: number;
  nationality?: string;
}

// Extended PlayerInfo type to include auction-related properties
export interface AuctionPlayerInfo extends BasePlayerInfo {
  playerId: string;
  imageUrl?: string;  // Optional for compatibility
  currentBid?: number;
  currentBidder?: string;
}