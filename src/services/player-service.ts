import { ethers } from "ethers";
import { getAuctionContract } from "../lib/auction-contract";

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
  // Indian Players
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
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/164.png",
    basePrice: 0.0001,
    age: 34,
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
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1124.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "India"
  },
  {
    id: 3,
    name: "Rohit Sharma",
    team: "Mumbai Indians",
    role: "Batsman",
    stats: {
      battingAverage: 45.8,
      strikeRate: 134.5,
      matchesPlayed: 228,
      totalRuns: 5879,
      highestScore: 118
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/107.png",
    basePrice: 0.0001,
    age: 37,
    nationality: "India"
  },
  {
    id: 4,
    name: "MS Dhoni",
    team: "Chennai Super Kings",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 39.5,
      strikeRate: 135.8,
      matchesPlayed: 234,
      totalRuns: 4978,
      highestScore: 84
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1.png",
    basePrice: 0.0001,
    age: 42,
    nationality: "India"
  },
  {
    id: 5,
    name: "Ravindra Jadeja",
    team: "Chennai Super Kings",
    role: "All-rounder",
    stats: {
      battingAverage: 30.4,
      strikeRate: 140.2,
      bowlingAverage: 29.3,
      economyRate: 7.6,
      matchesPlayed: 210,
      totalRuns: 2502,
      totalWickets: 132,
      bestBowlingFigures: "5/16"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/9.png",
    basePrice: 0.0001,
    age: 35,
    nationality: "India"
  },
  {
    id: 6,
    name: "KL Rahul",
    team: "Lucknow Super Giants",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 47.2,
      strikeRate: 136.3,
      matchesPlayed: 109,
      totalRuns: 3889,
      highestScore: 132
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1125.png",
    basePrice: 0.0001,
    age: 32,
    nationality: "India"
  },
  {
    id: 7,
    name: "Rishabh Pant",
    team: "Delhi Capitals",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 41.3,
      strikeRate: 151.4,
      matchesPlayed: 98,
      totalRuns: 2838,
      highestScore: 128
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2972.png",
    basePrice: 0.0001,
    age: 27,
    nationality: "India"
  },
  {
    id: 8,
    name: "Hardik Pandya",
    team: "Gujarat Titans",
    role: "All-rounder",
    stats: {
      battingAverage: 32.5,
      strikeRate: 151.2,
      bowlingAverage: 31.3,
      economyRate: 8.9,
      matchesPlayed: 107,
      totalRuns: 1963,
      totalWickets: 54,
      bestBowlingFigures: "3/20"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2740.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "India"
  },
  {
    id: 9,
    name: "Yuzvendra Chahal",
    team: "Rajasthan Royals",
    role: "Bowler",
    stats: {
      bowlingAverage: 23.1,
      economyRate: 7.7,
      matchesPlayed: 145,
      totalWickets: 187,
      bestBowlingFigures: "5/40"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/111.png",
    basePrice: 0.0001,
    age: 34,
    nationality: "India"
  },
  {
    id: 10,
    name: "Shreyas Iyer",
    team: "Kolkata Knight Riders",
    role: "Batsman",
    stats: {
      battingAverage: 42.7,
      strikeRate: 130.8,
      matchesPlayed: 101,
      totalRuns: 2776,
      highestScore: 96
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1563.png",
    basePrice: 0.0001,
    age: 29,
    nationality: "India"
  },
  {
    id: 11,
    name: "Shikhar Dhawan",
    team: "Punjab Kings",
    role: "Batsman",
    stats: {
      battingAverage: 42.1,
      strikeRate: 134.2,
      matchesPlayed: 206,
      totalRuns: 6244,
      highestScore: 106
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/41.png",
    basePrice: 0.0001,
    age: 38,
    nationality: "India"
  },
  {
    id: 12,
    name: "Suryakumar Yadav",
    team: "Mumbai Indians",
    role: "Batsman",
    stats: {
      battingAverage: 43.3,
      strikeRate: 156.9,
      matchesPlayed: 115,
      totalRuns: 3249,
      highestScore: 103
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/108.png",
    basePrice: 0.0001,
    age: 33,
    nationality: "India"
  },
  {
    id: 13,
    name: "Ravichandran Ashwin",
    team: "Rajasthan Royals",
    role: "All-rounder",
    stats: {
      bowlingAverage: 28.1,
      economyRate: 6.9,
      battingAverage: 16.4,
      strikeRate: 118.5,
      matchesPlayed: 184,
      totalWickets: 157,
      totalRuns: 635,
      bestBowlingFigures: "4/34"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/8.png",
    basePrice: 0.0001,
    age: 38,
    nationality: "India"
  },
  {
    id: 14,
    name: "Ishan Kishan",
    team: "Mumbai Indians",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 37.8,
      strikeRate: 144.1,
      matchesPlayed: 89,
      totalRuns: 2101,
      highestScore: 99
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2975.png",
    basePrice: 0.0001,
    age: 26,
    nationality: "India"
  },
  {
    id: 15,
    name: "Mohammed Shami",
    team: "Gujarat Titans",
    role: "Bowler",
    stats: {
      bowlingAverage: 27.7,
      economyRate: 8.3,
      matchesPlayed: 93,
      totalWickets: 99,
      bestBowlingFigures: "4/26"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/94.png",
    basePrice: 0.0001,
    age: 33,
    nationality: "India"
  },
  {
    id: 16,
    name: "Axar Patel",
    team: "Delhi Capitals",
    role: "All-rounder",
    stats: {
      bowlingAverage: 29.8,
      economyRate: 7.4,
      battingAverage: 25.3,
      strikeRate: 141.2,
      matchesPlayed: 123,
      totalWickets: 101,
      totalRuns: 1135,
      bestBowlingFigures: "4/21"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1113.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "India"
  },
  {
    id: 17,
    name: "Kuldeep Yadav",
    team: "Delhi Capitals",
    role: "Bowler",
    stats: {
      bowlingAverage: 26.5,
      economyRate: 8.1,
      matchesPlayed: 82,
      totalWickets: 82,
      bestBowlingFigures: "4/20"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/261.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "India"
  },
  {
    id: 18,
    name: "Prasidh Krishna",
    team: "Rajasthan Royals",
    role: "Bowler",
    stats: {
      bowlingAverage: 28.4,
      economyRate: 8.7,
      matchesPlayed: 39,
      totalWickets: 45,
      bestBowlingFigures: "4/30"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/5105.png",
    basePrice: 0.0001,
    age: 28,
    nationality: "India"
  },
  {
    id: 19,
    name: "Prithvi Shaw",
    team: "Delhi Capitals",
    role: "Batsman",
    stats: {
      battingAverage: 39.5,
      strikeRate: 152.3,
      matchesPlayed: 63,
      totalRuns: 1588,
      highestScore: 99
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3764.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "India"
  },
  {
    id: 20,
    name: "Shubman Gill",
    team: "Gujarat Titans",
    role: "Batsman",
    stats: {
      battingAverage: 44.2,
      strikeRate: 133.1,
      matchesPlayed: 74,
      totalRuns: 2265,
      highestScore: 129
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3761.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "India"
  },
  {
    id: 21,
    name: "Washington Sundar",
    team: "Sunrisers Hyderabad",
    role: "All-rounder",
    stats: {
      bowlingAverage: 31.7,
      economyRate: 7.2,
      battingAverage: 19.8,
      strikeRate: 121.6,
      matchesPlayed: 56,
      totalWickets: 32,
      totalRuns: 395,
      bestBowlingFigures: "3/16"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2973.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "India"
  },
  {
    id: 22,
    name: "T Natarajan",
    team: "Sunrisers Hyderabad",
    role: "Bowler",
    stats: {
      bowlingAverage: 28.9,
      economyRate: 8.7,
      matchesPlayed: 42,
      totalWickets: 55,
      bestBowlingFigures: "3/10"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3831.png",
    basePrice: 0.0001,
    age: 33,
    nationality: "India"
  },
  {
    id: 23,
    name: "Sanju Samson",
    team: "Rajasthan Royals",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 35.2,
      strikeRate: 146.8,
      matchesPlayed: 138,
      totalRuns: 3526,
      highestScore: 119
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/258.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "India"
  },
  {
    id: 24,
    name: "Arshdeep Singh",
    team: "Punjab Kings",
    role: "Bowler",
    stats: {
      bowlingAverage: 25.8,
      economyRate: 8.3,
      matchesPlayed: 49,
      totalWickets: 60,
      bestBowlingFigures: "5/32"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/4698.png",
    basePrice: 0.0001,
    age: 25,
    nationality: "India"
  },
  {
    id: 25,
    name: "Umran Malik",
    team: "Sunrisers Hyderabad",
    role: "Bowler",
    stats: {
      bowlingAverage: 27.4,
      economyRate: 9.1,
      matchesPlayed: 22,
      totalWickets: 22,
      bestBowlingFigures: "5/25"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/15154.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "India"
  },
  
  // International Players
  {
    id: 26,
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
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/509.png",
    basePrice: 0.0001,
    age: 33,
    nationality: "England"
  },
  {
    id: 27,
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
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2885.png",
    basePrice: 0.0001,
    age: 25,
    nationality: "Afghanistan"
  },
  {
    id: 28,
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
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/177.png",
    basePrice: 0.0001,
    age: 36,
    nationality: "West Indies"
  },
  {
    id: 29,
    name: "David Warner",
    team: "Delhi Capitals",
    role: "Batsman",
    stats: {
      battingAverage: 41.2,
      strikeRate: 139.8,
      matchesPlayed: 162,
      totalRuns: 5881,
      highestScore: 126
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/170.png",
    basePrice: 0.0001,
    age: 37,
    nationality: "Australia"
  },
  {
    id: 30,
    name: "AB de Villiers",
    team: "Royal Challengers Bangalore",
    role: "Batsman",
    stats: {
      battingAverage: 39.7,
      strikeRate: 151.7,
      matchesPlayed: 184,
      totalRuns: 5162,
      highestScore: 133
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/233.png",
    basePrice: 0.0001,
    age: 40,
    nationality: "South Africa"
  },
  {
    id: 31,
    name: "Kane Williamson",
    team: "Gujarat Titans",
    role: "Batsman",
    stats: {
      battingAverage: 36.2,
      strikeRate: 125.4,
      matchesPlayed: 76,
      totalRuns: 2021,
      highestScore: 89
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/440.png",
    basePrice: 0.0001,
    age: 34,
    nationality: "New Zealand"
  },
  {
    id: 32,
    name: "Glenn Maxwell",
    team: "Royal Challengers Bangalore",
    role: "All-rounder",
    stats: {
      battingAverage: 25.8,
      strikeRate: 158.5,
      bowlingAverage: 32.1,
      economyRate: 8.3,
      matchesPlayed: 110,
      totalRuns: 2205,
      totalWickets: 31,
      highestScore: 95,
      bestBowlingFigures: "2/15"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/282.png",
    basePrice: 0.0001,
    age: 35,
    nationality: "Australia"
  },
  {
    id: 33,
    name: "Trent Boult",
    team: "Mumbai Indians",
    role: "Bowler",
    stats: {
      bowlingAverage: 27.1,
      economyRate: 8.4,
      matchesPlayed: 78,
      totalWickets: 92,
      bestBowlingFigures: "4/18"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/969.png",
    basePrice: 0.0001,
    age: 34,
    nationality: "New Zealand"
  },
  {
    id: 34,
    name: "Kagiso Rabada",
    team: "Punjab Kings",
    role: "Bowler",
    stats: {
      bowlingAverage: 23.4,
      economyRate: 8.2,
      matchesPlayed: 58,
      totalWickets: 76,
      bestBowlingFigures: "4/21"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1664.png",
    basePrice: 0.0001,
    age: 29,
    nationality: "South Africa"
  },
  {
    id: 35,
    name: "Faf du Plessis",
    team: "Royal Challengers Bangalore",
    role: "Batsman",
    stats: {
      battingAverage: 36.7,
      strikeRate: 131.2,
      matchesPlayed: 116,
      totalRuns: 3403,
      highestScore: 96
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/24.png",
    basePrice: 0.0001,
    age: 39,
    nationality: "South Africa"
  },
  {
    id: 36,
    name: "Quinton de Kock",
    team: "Lucknow Super Giants",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 37.4,
      strikeRate: 137.2,
      matchesPlayed: 91,
      totalRuns: 2764,
      highestScore: 108
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/834.png",
    basePrice: 0.0001,
    age: 31,
    nationality: "South Africa"
  },
  {
    id: 37,
    name: "Liam Livingstone",
    team: "Punjab Kings",
    role: "All-rounder",
    stats: {
      battingAverage: 30.6,
      strikeRate: 162.8,
      bowlingAverage: 32.4,
      economyRate: 8.7,
      matchesPlayed: 22,
      totalRuns: 459,
      totalWickets: 7,
      highestScore: 84,
      bestBowlingFigures: "2/25"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3644.png",
    basePrice: 0.0001,
    age: 31,
    nationality: "England"
  },
  {
    id: 38,
    name: "Shimron Hetmyer",
    team: "Rajasthan Royals",
    role: "Batsman",
    stats: {
      battingAverage: 36.9,
      strikeRate: 155.6,
      matchesPlayed: 51,
      totalRuns: 1170,
      highestScore: 79
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1705.png",
    basePrice: 0.0001,
    age: 27,
    nationality: "West Indies"
  },
  {
    id: 39,
    name: "Nicholas Pooran",
    team: "Lucknow Super Giants",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 33.2,
      strikeRate: 142.5,
      matchesPlayed: 47,
      totalRuns: 912,
      highestScore: 77
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1703.png",
    basePrice: 0.0001,
    age: 28,
    nationality: "West Indies"
  },
  {
    id: 40,
    name: "Mitchell Marsh",
    team: "Delhi Capitals",
    role: "All-rounder",
    stats: {
      battingAverage: 28.5,
      strikeRate: 138.7,
      bowlingAverage: 31.4,
      economyRate: 8.9,
      matchesPlayed: 36,
      totalRuns: 513,
      totalWickets: 27,
      highestScore: 89,
      bestBowlingFigures: "2/21"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/221.png",
    basePrice: 0.0001,
    age: 32,
    nationality: "Australia"
  },
  {
    id: 41,
    name: "Sam Curran",
    team: "Punjab Kings",
    role: "All-rounder",
    stats: {
      battingAverage: 24.6,
      strikeRate: 141.2,
      bowlingAverage: 30.1,
      economyRate: 9.1,
      matchesPlayed: 32,
      totalRuns: 337,
      totalWickets: 32,
      highestScore: 55,
      bestBowlingFigures: "4/11"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3746.png",
    basePrice: 0.0001,
    age: 26,
    nationality: "England"
  },
  {
    id: 42,
    name: "Jason Holder",
    team: "Rajasthan Royals",
    role: "All-rounder",
    stats: {
      battingAverage: 21.3,
      strikeRate: 129.5,
      bowlingAverage: 29.8,
      economyRate: 8.9,
      matchesPlayed: 38,
      totalRuns: 320,
      totalWickets: 39,
      highestScore: 47,
      bestBowlingFigures: "3/19"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1075.png",
    basePrice: 0.0001,
    age: 32,
    nationality: "West Indies"
  },
  {
    id: 43,
    name: "Wanindu Hasaranga",
    team: "Royal Challengers Bangalore",
    role: "All-rounder",
    stats: {
      bowlingAverage: 24.8,
      economyRate: 7.9,
      battingAverage: 18.5,
      strikeRate: 127.6,
      matchesPlayed: 19,
      totalWickets: 26,
      totalRuns: 111,
      bestBowlingFigures: "4/20"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3082.png",
    basePrice: 0.0001,
    age: 27,
    nationality: "Sri Lanka"
  },
  {
    id: 44,
    name: "Marcus Stoinis",
    team: "Lucknow Super Giants",
    role: "All-rounder",
    stats: {
      battingAverage: 31.2,
      strikeRate: 140.6,
      bowlingAverage: 30.7,
      economyRate: 9.4,
      matchesPlayed: 67,
      totalRuns: 1070,
      totalWickets: 34,
      highestScore: 65,
      bestBowlingFigures: "4/15"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/964.png",
    basePrice: 0.0001,
    age: 34,
    nationality: "Australia"
  },
  {
    id: 45,
    name: "Anrich Nortje",
    team: "Delhi Capitals",
    role: "Bowler",
    stats: {
      bowlingAverage: 24.1,
      economyRate: 8.3,
      matchesPlayed: 24,
      totalWickets: 34,
      bestBowlingFigures: "3/12"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/5433.png",
    basePrice: 0.0001,
    age: 30,
    nationality: "South Africa"
  },
  {
    id: 46,
    name: "Jonny Bairstow",
    team: "Punjab Kings",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 35.7,
      strikeRate: 142.8,
      matchesPlayed: 39,
      totalRuns: 1038,
      highestScore: 114
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/506.png",
    basePrice: 0.0001,
    age: 34,
    nationality: "England"
  },
  {
    id: 47,
    name: "Moeen Ali",
    team: "Chennai Super Kings",
    role: "All-rounder",
    stats: {
      battingAverage: 31.6,
      strikeRate: 147.5,
      bowlingAverage: 29.4,
      economyRate: 7.8,
      matchesPlayed: 42,
      totalRuns: 633,
      totalWickets: 24,
      highestScore: 66,
      bestBowlingFigures: "3/7"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1735.png",
    basePrice: 0.0001,
    age: 36,
    nationality: "England"
  },
  {
    id: 48,
    name: "Chris Morris",
    team: "Rajasthan Royals",
    role: "All-rounder",
    stats: {
      battingAverage: 23.5,
      strikeRate: 150.2,
      bowlingAverage: 26.8,
      economyRate: 8.3,
      matchesPlayed: 81,
      totalRuns: 618,
      totalWickets: 95,
      highestScore: 82,
      bestBowlingFigures: "4/23"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/836.png",
    basePrice: 0.0001,
    age: 36,
    nationality: "South Africa"
  },
  {
    id: 49,
    name: "Alzarri Joseph",
    team: "Gujarat Titans",
    role: "Bowler",
    stats: {
      bowlingAverage: 25.2,
      economyRate: 8.1,
      matchesPlayed: 16,
      totalWickets: 20,
      bestBowlingFigures: "6/12"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1748.png",
    basePrice: 0.0001,
    age: 27,
    nationality: "West Indies"
  },
  {
    id: 50,
    name: "Adam Zampa",
    team: "Rajasthan Royals",
    role: "Bowler",
    stats: {
      bowlingAverage: 29.6,
      economyRate: 7.7,
      matchesPlayed: 14,
      totalWickets: 21,
      bestBowlingFigures: "3/16"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/958.png",
    basePrice: 0.0001,
    age: 32,
    nationality: "Australia"
  },
  
  // Rising Stars and New Talent
  {
    id: 51,
    name: "Tilak Varma",
    team: "Mumbai Indians",
    role: "Batsman",
    stats: {
      battingAverage: 41.5,
      strikeRate: 147.8,
      matchesPlayed: 14,
      totalRuns: 397,
      highestScore: 84
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/15154.png",
    basePrice: 0.0001,
    age: 22,
    nationality: "India"
  },
  {
    id: 52,
    name: "Rinku Singh",
    team: "Kolkata Knight Riders",
    role: "Batsman",
    stats: {
      battingAverage: 38.2,
      strikeRate: 151.4,
      matchesPlayed: 20,
      totalRuns: 421,
      highestScore: 67
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3830.png",
    basePrice: 0.0001,
    age: 26,
    nationality: "India"
  },
  {
    id: 53,
    name: "Tim David",
    team: "Mumbai Indians",
    role: "Batsman",
    stats: {
      battingAverage: 34.9,
      strikeRate: 172.8,
      matchesPlayed: 15,
      totalRuns: 314,
      highestScore: 64
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/4951.png",
    basePrice: 0.0001,
    age: 28,
    nationality: "Australia"
  },
  {
    id: 54,
    name: "Yashasvi Jaiswal",
    team: "Rajasthan Royals",
    role: "Batsman",
    stats: {
      battingAverage: 39.3,
      strikeRate: 148.3,
      matchesPlayed: 24,
      totalRuns: 642,
      highestScore: 124
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/13538.png",
    basePrice: 0.0001,
    age: 22,
    nationality: "India"
  },
  {
    id: 55,
    name: "Marco Jansen",
    team: "Sunrisers Hyderabad",
    role: "All-rounder",
    stats: {
      bowlingAverage: 27.8,
      economyRate: 8.4,
      battingAverage: 15.2,
      strikeRate: 120.5,
      matchesPlayed: 18,
      totalWickets: 19,
      totalRuns: 106,
      bestBowlingFigures: "3/25"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/14978.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "South Africa"
  },
  // Adding more players to round up to 100+
  {
    id: 56,
    name: "Avesh Khan",
    team: "Lucknow Super Giants",
    role: "Bowler",
    stats: {
      bowlingAverage: 25.3,
      economyRate: 8.9,
      matchesPlayed: 37,
      totalWickets: 47,
      bestBowlingFigures: "4/18"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1561.png",
    basePrice: 0.0001,
    age: 27,
    nationality: "India"
  },
  {
    id: 57,
    name: "Rahul Tripathi",
    team: "Sunrisers Hyderabad",
    role: "Batsman",
    stats: {
      battingAverage: 36.2,
      strikeRate: 142.4,
      matchesPlayed: 76,
      totalRuns: 1854,
      highestScore: 93
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3838.png",
    basePrice: 0.0001,
    age: 32,
    nationality: "India"
  },
  {
    id: 58,
    name: "Arshad Khan",
    team: "Mumbai Indians",
    role: "Bowler",
    stats: {
      bowlingAverage: 28.9,
      economyRate: 9.2,
      matchesPlayed: 9,
      totalWickets: 10,
      bestBowlingFigures: "3/21"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20594.png",
    basePrice: 0.0001,
    age: 25,
    nationality: "India"
  },
  {
    id: 59,
    name: "Prabhsimran Singh",
    team: "Punjab Kings",
    role: "Wicketkeeper-Batsman",
    stats: {
      battingAverage: 33.1,
      strikeRate: 149.6,
      matchesPlayed: 14,
      totalRuns: 298,
      highestScore: 103
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/5436.png",
    basePrice: 0.0001,
    age: 23,
    nationality: "India"
  },
  {
    id: 60,
    name: "Gerald Coetzee",
    team: "Mumbai Indians",
    role: "Bowler",
    stats: {
      bowlingAverage: 24.2,
      economyRate: 8.7,
      matchesPlayed: 7,
      totalWickets: 9,
      bestBowlingFigures: "3/19"
    },
    image: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20599.png",
    basePrice: 0.0001,
    age: 24,
    nationality: "South Africa"
  }
  // Additional players can be added in the same format
  // up to 100 or more as required
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