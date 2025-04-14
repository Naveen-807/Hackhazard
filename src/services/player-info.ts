/**
 * Represents the stats for a player.
 */
export interface PlayerStats {
  /**
   * Batting average.
   */
  battingAverage: number;
  /**
   * Economy.
   */
  economy: number;
  /**
   * Strike rate
   */
  strikeRate?: number;
  /**
   * Wickets taken
   */
  wickets?: number;
  /**
   * Runs scored
   */
  runs?: number;
  /**
   * Matches played
   */
  matches?: number;
}

/**
 * Represents information about a player.
 */
export interface PlayerInfo {
  /**
   * The name of the player.
   */
  name: string;
  /**
   * The role of the player (e.g., Opener, Bowler).
   */
  role: string;
  /**
   * The stats of the player.
   */
  stats: PlayerStats;
  /**
   * URL of the player image.
   */
  imageUrl: string;
  /**
   * Base price of the player.
   */
  basePrice: number;
  /**
   * Current bid for the player
   */
  currentBid?: number;
  /**
   * The current bidder for the player
   */
  currentBidder?: string;
  /**
   * Player ID.
   */
  playerId: string;
  /**
   * Nationality of the player
   */
  nationality?: string;
  /**
   * Age of the player
   */
  age?: number;
  /**
   * Previous team
   */
  previousTeam?: string;
  /**
   * Player's specialty
   */
  specialty?: string;
}

// Updated player images with official IPL website URLs
const iplPlayers: PlayerInfo[] = [
  {
    playerId: "player1",
    name: "Virat Kohli",
    role: "Batsman",
    nationality: "Indian",
    age: 33,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Aggressive batting, chase master",
    stats: {
      battingAverage: 37.97,
      economy: 0,
      strikeRate: 130.73,
      runs: 6624,
      matches: 223,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/164.png",
    basePrice: 0.001,
  },
  {
    playerId: "player2",
    name: "Rohit Sharma",
    role: "Batsman",
    nationality: "Indian",
    age: 35,
    previousTeam: "Mumbai Indians",
    specialty: "Power hitting, captaincy",
    stats: {
      battingAverage: 30.30,
      economy: 0,
      strikeRate: 130.06,
      runs: 5879,
      matches: 227,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/107.png",
    basePrice: 0.001,
  },
  {
    playerId: "player3",
    name: "Jasprit Bumrah",
    role: "Bowler",
    nationality: "Indian",
    age: 29,
    previousTeam: "Mumbai Indians",
    specialty: "Yorkers, death bowling",
    stats: {
      battingAverage: 4.35,
      economy: 7.39,
      wickets: 145,
      matches: 120,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1124.png",
    basePrice: 0.001,
  },
  {
    playerId: "player4",
    name: "MS Dhoni",
    role: "Wicket-Keeper",
    nationality: "Indian",
    age: 41,
    previousTeam: "Chennai Super Kings",
    specialty: "Finisher, captaincy, wicket-keeping",
    stats: {
      battingAverage: 38.79,
      economy: 0,
      strikeRate: 135.92,
      runs: 4985,
      matches: 234,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1.png",
    basePrice: 0.001,
  },
  {
    playerId: "player5",
    name: "Ravindra Jadeja",
    role: "All-Rounder",
    nationality: "Indian",
    age: 34,
    previousTeam: "Chennai Super Kings",
    specialty: "Spin bowling, batting, fielding",
    stats: {
      battingAverage: 26.61,
      economy: 7.62,
      strikeRate: 127.61,
      runs: 2692,
      wickets: 132,
      matches: 210,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/9.png",
    basePrice: 0.001,
  },
  {
    playerId: "player6",
    name: "KL Rahul",
    role: "Batsman",
    nationality: "Indian",
    age: 31,
    previousTeam: "Lucknow Super Giants",
    specialty: "Consistent batting, wicket-keeping",
    stats: {
      battingAverage: 47.32,
      economy: 0,
      strikeRate: 134.53,
      runs: 4121,
      matches: 109,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1125.png",
    basePrice: 0.001,
  },
  {
    playerId: "player7",
    name: "Jos Buttler",
    role: "Wicket-Keeper",
    nationality: "English",
    age: 32,
    previousTeam: "Rajasthan Royals",
    specialty: "Explosive batting, wicket-keeping",
    stats: {
      battingAverage: 38.94,
      economy: 0,
      strikeRate: 149.05,
      runs: 3223,
      matches: 91,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/509.png",
    basePrice: 0.001,
  },
  {
    playerId: "player8",
    name: "Rashid Khan",
    role: "Bowler",
    nationality: "Afghan",
    age: 24,
    previousTeam: "Gujarat Titans",
    specialty: "Leg spin, lower-order batting",
    stats: {
      battingAverage: 13.05,
      economy: 6.64,
      wickets: 112,
      matches: 92,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2885.png",
    basePrice: 0.001,
  },
  {
    playerId: "player9",
    name: "Hardik Pandya",
    role: "All-Rounder",
    nationality: "Indian",
    age: 29,
    previousTeam: "Gujarat Titans",
    specialty: "Power hitting, medium pace bowling",
    stats: {
      battingAverage: 30.27,
      economy: 8.84,
      strikeRate: 147.59,
      runs: 2100,
      wickets: 53,
      matches: 107,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2740.png",
    basePrice: 0.001,
  },
  {
    playerId: "player10",
    name: "David Warner",
    role: "Batsman",
    nationality: "Australian",
    age: 36,
    previousTeam: "Delhi Capitals",
    specialty: "Opening batsman, leadership",
    stats: {
      battingAverage: 41.20,
      economy: 0,
      strikeRate: 139.97,
      runs: 5881,
      matches: 162,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/170.png",
    basePrice: 0.001,
  },
  {
    playerId: "player11",
    name: "Yuzvendra Chahal",
    role: "Bowler",
    nationality: "Indian",
    age: 32,
    previousTeam: "Rajasthan Royals",
    specialty: "Leg spin bowling",
    stats: {
      battingAverage: 4.89,
      economy: 7.67,
      wickets: 166,
      matches: 131,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/111.png",
    basePrice: 0.001,
  },
  {
    playerId: "player12",
    name: "Suryakumar Yadav",
    role: "Batsman",
    nationality: "Indian",
    age: 32,
    previousTeam: "Mumbai Indians",
    specialty: "360-degree batting, finishing",
    stats: {
      battingAverage: 31.39,
      economy: 0,
      strikeRate: 143.82,
      runs: 2644,
      matches: 123,
    },
    imageUrl: "https://assets.iplt20.com/ipl/IPLHeadshot2022/108.png",
    basePrice: 0.001,
  },
];

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Asynchronously retrieves player information for a given player ID.
 *
 * @param playerId The ID of the player to retrieve information for.
 * @returns A promise that resolves to a PlayerInfo object containing the player's information or undefined if player not found.
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo | undefined> {
  return iplPlayers.find(player => player.playerId === playerId);
}

/**
 * Get all available players
 * 
 * @returns A promise that resolves to an array of all players
 */
export async function getAllPlayers(): Promise<PlayerInfo[]> {
  return [...iplPlayers];
}

/**
 * Get a shuffled list of players
 */
export async function getShuffledPlayers(): Promise<PlayerInfo[]> {
  return shuffleArray(iplPlayers);
}
