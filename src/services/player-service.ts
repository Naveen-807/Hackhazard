import { ethers } from "ethers";
import { getAuctionContract } from "./auction-contract";

// Interface for player information
export interface PlayerInfo {
  id: number;
  name: string;
  team?: string;
  role: string;
  stats: {
    battingAverage?: number;
    strikeRate?: number;
    bowlingAverage?: number;
    economyRate?: number;
    highestScore?: number;
    bestBowlingFigures?: string;
    matchesPlayed: number;
    totalRuns?: number;
    totalWickets?: number;
  };
  image: string;
  basePrice: number; // in MONAD
  age: number;
  nationality: string;
}

// Mock database of players for demo
const PLAYERS_DB: PlayerInfo[] = [
  {
    id: 1,
    name: "Virat Kohli",
    team: "Royal Challengers Bangalore",
    role: "Batsman",
    stats: {
      battingAverage: 53.5,
      strikeRate: 139.2,
      matchesPlayed: 223,
      totalRuns: 6624,
      highestScore: 113
    },
    image: "/images/players/virat-kohli.jpg",
    basePrice: 2.0, // 2 MONAD
    age: 33,
    nationality: "India"
  },
  {
    id: 2,
    name: "Jasprit Bumrah",
    team: "Mumbai Indians",
    role: "Bowler",
    stats: {
      bowlingAverage: 23.31,
      economyRate: 7.4,
      matchesPlayed: 120,
      totalWickets: 130,
      bestBowlingFigures: "5/10"
    },
    image: "/images/players/jasprit-bumrah.jpg",
    basePrice: 1.8, // 1.8 MONAD
    age: 28,
    nationality: "India"
  },
  {
    id: 3,
    name: "Andre Russell",
    team: "Kolkata Knight Riders",
    role: "All-rounder",
    stats: {
      battingAverage: 29.75,
      strikeRate: 177.88,
      bowlingAverage: 25.22,
      economyRate: 9.12,
      matchesPlayed: 98,
      totalRuns: 1934,
      totalWickets: 82,
      highestScore: 88,
      bestBowlingFigures: "4/20"
    },
    image: "/images/players/andre-russell.jpg",
    basePrice: 1.5, // 1.5 MONAD
    age: 34,
    nationality: "West Indies"
  },
  {
    id: 4,
    name: "Jos Buttler",
    team: "Rajasthan Royals",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 35.30,
      strikeRate: 150.12,
      matchesPlayed: 89,
      totalRuns: 2831,
      highestScore: 124
    },
    image: "/images/players/jos-buttler.jpg",
    basePrice: 1.7, // 1.7 MONAD
    age: 31,
    nationality: "England"
  },
  {
    id: 5,
    name: "Rashid Khan",
    team: "Gujarat Titans",
    role: "Bowler",
    stats: {
      bowlingAverage: 20.58,
      economyRate: 6.35,
      matchesPlayed: 92,
      totalWickets: 112,
      bestBowlingFigures: "4/24"
    },
    image: "/images/players/rashid-khan.jpg",
    basePrice: 1.6, // 1.6 MONAD
    age: 23,
    nationality: "Afghanistan"
  }
];

// Function to get player by ID
export const getPlayerById = (id: number): PlayerInfo | undefined => {
  return PLAYERS_DB.find(player => player.id === id);
};

// Function to get all players
export const getAllPlayers = (): PlayerInfo[] => {
  return PLAYERS_DB;
};

// Function to get a random player for auction
export const getRandomPlayerForAuction = (): PlayerInfo => {
  const randomIndex = Math.floor(Math.random() * PLAYERS_DB.length);
  return PLAYERS_DB[randomIndex];
};

// Function to convert player info to NFT metadata
export const playerToNFTMetadata = (player: PlayerInfo) => {
  return {
    name: `${player.name} #${player.id}`,
    description: `NFT representing ${player.name}, a ${player.role} from ${player.team}`,
    image: player.image,
    attributes: [
      { trait_type: "Name", value: player.name },
      { trait_type: "Role", value: player.role },
      { trait_type: "Team", value: player.team },
      { trait_type: "Age", value: player.age },
      { trait_type: "Nationality", value: player.nationality },
      { trait_type: "Matches Played", value: player.stats.matchesPlayed }
    ]
  };
};

// Function to get player data from blockchain
export const getPlayerFromContract = async (
  provider: ethers.Provider,
  playerId: number
): Promise<{
  success: boolean;
  player?: PlayerInfo;
  error?: string;
}> => {
  try {
    const contract = await getAuctionContract(provider);
    
    // In a real implementation, this would fetch data from the contract
    // For demo purposes, we'll use our mock database
    const player = getPlayerById(playerId);
    
    if (!player) {
      return {
        success: false,
        error: "Player not found"
      };
    }
    
    return {
      success: true,
      player
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch player data"
    };
  }
};