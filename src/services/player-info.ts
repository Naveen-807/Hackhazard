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
  /**
   * Team ID the player belongs to (after being purchased)
   */
  teamId?: string;
}

/**
 * Represents information about a team.
 */
export interface TeamInfo {
  /**
   * Team ID.
   */
  teamId: string;
  /**
   * The name of the team.
   */
  name: string;
  /**
   * Team logo URL
   */
  logoUrl: string;
  /**
   * Team primary color (hex code)
   */
  primaryColor: string;
  /**
   * Team accent color (hex code)
   */
  accentColor: string;
  /**
   * Team owner
   */
  owner: string;
  /**
   * Team home venue
   */
  homeVenue?: string;
  /**
   * Team championships won
   */
  championships?: number;
  /**
   * Team coach name
   */
  coach?: string;
  /**
   * Team captain name
   */
  captain?: string;
  /**
   * Team performance stats
   */
  stats?: {
    /**
     * Total matches played
     */
    matchesPlayed: number;
    /**
     * Matches won
     */
    matchesWon: number;
    /**
     * Matches lost
     */
    matchesLost: number;
    /**
     * Win percentage
     */
    winPercentage: number;
  };
}

// Flag to track if player data is ready to use
let playersInitialized = false;
let initializationError = false;
let lastError: Error | null = null;

// Team data with official IPL team information
const iplTeams: TeamInfo[] = [
  {
    teamId: "mi",
    name: "Mumbai Indians",
    logoUrl: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Medium/MI.png",
    primaryColor: "#004BA0",
    accentColor: "#D1AB3E",
    owner: "Reliance Industries",
    homeVenue: "Wankhede Stadium",
    championships: 5,
    coach: "Mark Boucher",
    captain: "Rohit Sharma",
    stats: {
      matchesPlayed: 248,
      matchesWon: 138,
      matchesLost: 110,
      winPercentage: 55.65
    }
  },
  {
    teamId: "csk",
    name: "Chennai Super Kings",
    logoUrl: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Medium/CSK.png",
    primaryColor: "#FFFF00",
    accentColor: "#0081E8",
    owner: "Chennai Super Kings Cricket Ltd.",
    homeVenue: "M. A. Chidambaram Stadium",
    championships: 5,
    coach: "Stephen Fleming",
    captain: "MS Dhoni",
    stats: {
      matchesPlayed: 233,
      matchesWon: 134,
      matchesLost: 99,
      winPercentage: 57.51
    }
  },
  {
    teamId: "rcb",
    name: "Royal Challengers Bangalore",
    logoUrl: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Medium/RCB.png",
    primaryColor: "#B81429",
    accentColor: "#000000",
    owner: "United Spirits",
    homeVenue: "M. Chinnaswamy Stadium",
    championships: 0,
    coach: "Andy Flower",
    captain: "Faf du Plessis",
    stats: {
      matchesPlayed: 246,
      matchesWon: 115,
      matchesLost: 131,
      winPercentage: 46.75
    }
  },
  {
    teamId: "kkr",
    name: "Kolkata Knight Riders",
    logoUrl: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Medium/KKR.png",
    primaryColor: "#3A225D",
    accentColor: "#D4AF37",
    owner: "Knight Riders Group",
    homeVenue: "Eden Gardens",
    championships: 2,
    coach: "Chandrakant Pandit",
    captain: "Shreyas Iyer",
    stats: {
      matchesPlayed: 243,
      matchesWon: 124,
      matchesLost: 119,
      winPercentage: 51.03
    }
  }
];

// Updated player images to use local assets
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
    imageUrl: "/assets/players/player1.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player2.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player3.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player4.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player5.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player6.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player7.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player8.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player9.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player10.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player11.png",
    basePrice: 0.0001,
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
    imageUrl: "/assets/players/player12.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player13",
    name: "Rishabh Pant",
    role: "Wicket-Keeper",
    nationality: "Indian",
    age: 25,
    previousTeam: "Delhi Capitals",
    specialty: "Aggressive batting, wicket-keeping",
    stats: {
      battingAverage: 34.45,
      economy: 0,
      strikeRate: 147.97,
      runs: 2838,
      matches: 98,
    },
    imageUrl: "/assets/players/player13.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player14",
    name: "Kane Williamson",
    role: "Batsman",
    nationality: "New Zealand",
    age: 32,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Technical batting, leadership",
    stats: {
      battingAverage: 36.22,
      economy: 0,
      strikeRate: 126.17,
      runs: 2101,
      matches: 76,
    },
    imageUrl: "/assets/players/player14.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player15",
    name: "Kagiso Rabada",
    role: "Bowler",
    nationality: "South African",
    age: 28,
    previousTeam: "Punjab Kings",
    specialty: "Express pace, death bowling",
    stats: {
      battingAverage: 8.32,
      economy: 8.43,
      wickets: 99,
      matches: 63,
    },
    imageUrl: "/assets/players/player15.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player16",
    name: "Jos Buttler",
    role: "Wicket-Keeper",
    nationality: "English",
    age: 32,
    previousTeam: "Rajasthan Royals",
    specialty: "Power hitting, opening",
    stats: {
      battingAverage: 38.94,
      economy: 0,
      strikeRate: 149.05,
      runs: 3223,
      matches: 91,
    },
    imageUrl: "/assets/players/player16.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player17",
    name: "Shreyas Iyer",
    role: "Batsman",
    nationality: "Indian",
    age: 28,
    previousTeam: "Kolkata Knight Riders",
    specialty: "Middle-order batting, captaincy",
    stats: {
      battingAverage: 31.41,
      economy: 0,
      strikeRate: 125.25,
      runs: 2776,
      matches: 101,
    },
    imageUrl: "/assets/players/player17.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player18",
    name: "Glenn Maxwell",
    role: "All-Rounder",
    nationality: "Australian",
    age: 34,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Power hitting, off-spin",
    stats: {
      battingAverage: 24.81,
      economy: 8.25,
      strikeRate: 153.91,
      runs: 2319,
      wickets: 30,
      matches: 112,
    },
    imageUrl: "/assets/players/player18.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player19",
    name: "Bhuvneshwar Kumar",
    role: "Bowler",
    nationality: "Indian",
    age: 33,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Swing bowling, death overs",
    stats: {
      battingAverage: 8.32,
      economy: 7.38,
      wickets: 154,
      matches: 159,
    },
    imageUrl: "/assets/players/player19.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player20",
    name: "Faf du Plessis",
    role: "Batsman",
    nationality: "South African",
    age: 38,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Opening, captaincy, fielding",
    stats: {
      battingAverage: 36.04,
      economy: 0,
      strikeRate: 130.84,
      runs: 3403,
      matches: 116,
    },
    imageUrl: "/assets/players/player20.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player21",
    name: "Quinton de Kock",
    role: "Wicket-Keeper",
    nationality: "South African",
    age: 30,
    previousTeam: "Lucknow Super Giants",
    specialty: "Opening, wicket-keeping",
    stats: {
      battingAverage: 30.46,
      economy: 0,
      strikeRate: 133.51,
      runs: 2764,
      matches: 91,
    },
    imageUrl: "/assets/players/player21.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player22",
    name: "Shikhar Dhawan",
    role: "Batsman",
    nationality: "Indian",
    age: 37,
    previousTeam: "Punjab Kings",
    specialty: "Opening, consistency",
    stats: {
      battingAverage: 34.79,
      economy: 0,
      strikeRate: 127.14,
      runs: 6244,
      matches: 206,
    },
    imageUrl: "/assets/players/player22.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player23",
    name: "Mitchell Starc",
    role: "Bowler",
    nationality: "Australian",
    age: 33,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Left-arm fast bowling, yorkers",
    stats: {
      battingAverage: 9.45,
      economy: 8.31,
      wickets: 73,
      matches: 58,
    },
    imageUrl: "/assets/players/player23.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player24",
    name: "Axar Patel",
    role: "All-Rounder",
    nationality: "Indian",
    age: 29,
    previousTeam: "Delhi Capitals",
    specialty: "Left-arm spin, lower-order batting",
    stats: {
      battingAverage: 18.94,
      economy: 7.43,
      strikeRate: 128.26,
      runs: 1252,
      wickets: 109,
      matches: 128,
    },
    imageUrl: "/assets/players/player24.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player25",
    name: "Trent Boult",
    role: "Bowler",
    nationality: "New Zealand",
    age: 33,
    previousTeam: "Rajasthan Royals",
    specialty: "Swing bowling, new ball specialist",
    stats: {
      battingAverage: 6.28,
      economy: 8.27,
      wickets: 105,
      matches: 78,
    },
    imageUrl: "/assets/players/player25.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player26",
    name: "Krunal Pandya",
    role: "All-Rounder",
    nationality: "Indian",
    age: 32,
    previousTeam: "Lucknow Super Giants",
    specialty: "Left-arm spin, power hitting",
    stats: {
      battingAverage: 22.62,
      economy: 7.44,
      strikeRate: 138.53,
      runs: 1326,
      wickets: 61,
      matches: 98,
    },
    imageUrl: "/assets/players/player26.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player27",
    name: "Nicholas Pooran",
    role: "Wicket-Keeper",
    nationality: "West Indian",
    age: 27,
    previousTeam: "Lucknow Super Giants",
    specialty: "Power hitting, wicket-keeping",
    stats: {
      battingAverage: 26.06,
      economy: 0,
      strikeRate: 150.07,
      runs: 1270,
      matches: 57,
    },
    imageUrl: "/assets/players/player27.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player28",
    name: "Kuldeep Yadav",
    role: "Bowler",
    nationality: "Indian",
    age: 28,
    previousTeam: "Delhi Capitals",
    specialty: "Chinaman bowling, variations",
    stats: {
      battingAverage: 7.32,
      economy: 8.23,
      wickets: 82,
      matches: 65,
    },
    imageUrl: "/assets/players/player28.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player29",
    name: "Mohammed Siraj",
    role: "Bowler",
    nationality: "Indian",
    age: 29,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Fast bowling, swing",
    stats: {
      battingAverage: 5.84,
      economy: 8.78,
      wickets: 78,
      matches: 74,
    },
    imageUrl: "/assets/players/player29.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player30",
    name: "Shimron Hetmyer",
    role: "Batsman",
    nationality: "West Indian",
    age: 26,
    previousTeam: "Rajasthan Royals",
    specialty: "Finisher, power hitting",
    stats: {
      battingAverage: 31.72,
      economy: 0,
      strikeRate: 153.64,
      runs: 1083,
      matches: 47,
    },
    imageUrl: "/assets/players/player30.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player31",
    name: "Mohammed Shami",
    role: "Bowler",
    nationality: "Indian",
    age: 32,
    previousTeam: "Gujarat Titans",
    specialty: "Seam bowling, new ball specialist",
    stats: {
      battingAverage: 7.63,
      economy: 8.52,
      wickets: 99,
      matches: 93,
    },
    imageUrl: "/assets/players/player31.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player32",
    name: "Jonny Bairstow",
    role: "Wicket-Keeper",
    nationality: "English",
    age: 33,
    previousTeam: "Punjab Kings",
    specialty: "Explosive batting, wicket-keeping",
    stats: {
      battingAverage: 35.22,
      economy: 0,
      strikeRate: 142.65,
      runs: 1291,
      matches: 39,
    },
    imageUrl: "/assets/players/player32.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player33",
    name: "Dinesh Karthik",
    role: "Wicket-Keeper",
    nationality: "Indian",
    age: 37,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Finisher, wicket-keeping",
    stats: {
      battingAverage: 25.92,
      economy: 0,
      strikeRate: 132.71,
      runs: 4376,
      matches: 229,
    },
    imageUrl: "/assets/players/player33.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player34",
    name: "Liam Livingstone",
    role: "All-Rounder",
    nationality: "English",
    age: 29,
    previousTeam: "Punjab Kings",
    specialty: "360-degree batting, spin bowling",
    stats: {
      battingAverage: 30.64,
      economy: 8.75,
      strikeRate: 165.78,
      runs: 522,
      wickets: 6,
      matches: 24,
    },
    imageUrl: "/assets/players/player34.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player35",
    name: "Shubman Gill",
    role: "Batsman",
    nationality: "Indian",
    age: 23,
    previousTeam: "Gujarat Titans",
    specialty: "Technical batting, opening",
    stats: {
      battingAverage: 32.24,
      economy: 0,
      strikeRate: 125.67,
      runs: 1900,
      matches: 74,
    },
    imageUrl: "/assets/players/player35.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player36",
    name: "Shardul Thakur",
    role: "All-Rounder",
    nationality: "Indian",
    age: 31,
    previousTeam: "Kolkata Knight Riders",
    specialty: "Medium pace, lower-order batting",
    stats: {
      battingAverage: 12.23,
      economy: 9.15,
      strikeRate: 145.01,
      runs: 258,
      wickets: 82,
      matches: 74,
    },
    imageUrl: "/assets/players/player36.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player37",
    name: "Ishan Kishan",
    role: "Wicket-Keeper",
    nationality: "Indian",
    age: 24,
    previousTeam: "Mumbai Indians",
    specialty: "Power-hitting, wicket-keeping",
    stats: {
      battingAverage: 28.29,
      economy: 0,
      strikeRate: 136.33,
      runs: 1870,
      matches: 75,
    },
    imageUrl: "/assets/players/player37.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player38",
    name: "Deepak Chahar",
    role: "Bowler",
    nationality: "Indian",
    age: 30,
    previousTeam: "Chennai Super Kings",
    specialty: "Swing bowling, powerplay specialist",
    stats: {
      battingAverage: 14.89,
      economy: 7.80,
      wickets: 63,
      matches: 63,
    },
    imageUrl: "/assets/players/player38.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player39",
    name: "Tim David",
    role: "Batsman",
    nationality: "Singapore/Australian",
    age: 27,
    previousTeam: "Mumbai Indians",
    specialty: "Power hitting, finisher",
    stats: {
      battingAverage: 25.85,
      economy: 0,
      strikeRate: 164.32,
      runs: 310,
      matches: 14,
    },
    imageUrl: "/assets/players/player39.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player40",
    name: "T Natarajan",
    role: "Bowler",
    nationality: "Indian",
    age: 31,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Yorkers, death bowling",
    stats: {
      battingAverage: 2.75,
      economy: 8.35,
      wickets: 52,
      matches: 42,
    },
    imageUrl: "/assets/players/player40.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player41",
    name: "Avesh Khan",
    role: "Bowler",
    nationality: "Indian",
    age: 26,
    previousTeam: "Lucknow Super Giants",
    specialty: "Fast bowling, death bowling",
    stats: {
      battingAverage: 4.25,
      economy: 8.09,
      wickets: 47,
      matches: 37,
    },
    imageUrl: "/assets/players/player41.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player42",
    name: "Washington Sundar",
    role: "All-Rounder",
    nationality: "Indian",
    age: 23,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Off-spin, powerplay bowling, batting",
    stats: {
      battingAverage: 16.79,
      economy: 7.24,
      strikeRate: 121.32,
      runs: 318,
      wickets: 34,
      matches: 47,
    },
    imageUrl: "/assets/players/player42.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player43",
    name: "Wriddhiman Saha",
    role: "Wicket-Keeper",
    nationality: "Indian",
    age: 38,
    previousTeam: "Gujarat Titans",
    specialty: "Wicket-keeping, opening",
    stats: {
      battingAverage: 24.29,
      economy: 0,
      strikeRate: 128.53,
      runs: 2427,
      matches: 144,
    },
    imageUrl: "/assets/players/player43.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player44",
    name: "Umran Malik",
    role: "Bowler",
    nationality: "Indian",
    age: 23,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Express pace, raw talent",
    stats: {
      battingAverage: 3.5,
      economy: 9.15,
      wickets: 22,
      matches: 22,
    },
    imageUrl: "/assets/players/player44.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player45",
    name: "Devon Conway",
    role: "Batsman",
    nationality: "New Zealand",
    age: 31,
    previousTeam: "Chennai Super Kings",
    specialty: "Solid opener, left-handed",
    stats: {
      battingAverage: 42.35,
      economy: 0,
      strikeRate: 136.73,
      runs: 508,
      matches: 13,
    },
    imageUrl: "/assets/players/player45.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player46",
    name: "Sam Curran",
    role: "All-Rounder",
    nationality: "English",
    age: 24,
    previousTeam: "Punjab Kings",
    specialty: "Left-arm pace, batting",
    stats: {
      battingAverage: 21.55,
      economy: 9.18,
      strikeRate: 136.93,
      runs: 706,
      wickets: 49,
      matches: 47,
    },
    imageUrl: "/assets/players/player46.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player47",
    name: "Arshdeep Singh",
    role: "Bowler",
    nationality: "Indian",
    age: 24,
    previousTeam: "Punjab Kings",
    specialty: "Left-arm pace, death bowling",
    stats: {
      battingAverage: 5.33,
      economy: 8.65,
      wickets: 48,
      matches: 43,
    },
    imageUrl: "/assets/players/player47.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player48",
    name: "Alzarri Joseph",
    role: "Bowler",
    nationality: "West Indian",
    age: 26,
    previousTeam: "Gujarat Titans",
    specialty: "Fast bowling, bounce",
    stats: {
      battingAverage: 4.5,
      economy: 8.75,
      wickets: 16,
      matches: 16,
    },
    imageUrl: "/assets/players/player48.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player49",
    name: "Mukesh Kumar",
    role: "Bowler",
    nationality: "Indian",
    age: 29,
    previousTeam: "Delhi Capitals",
    specialty: "Medium pace, swing",
    stats: {
      battingAverage: 3.75,
      economy: 10.05,
      wickets: 7,
      matches: 10,
    },
    imageUrl: "/assets/players/player49.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player50",
    name: "Harry Brook",
    role: "Batsman",
    nationality: "English",
    age: 24,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Attacking batting, versatility",
    stats: {
      battingAverage: 12.57,
      economy: 0,
      strikeRate: 123.71,
      runs: 190,
      matches: 11,
    },
    imageUrl: "/assets/players/player50.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player51",
    name: "Jofra Archer",
    role: "Bowler",
    nationality: "English",
    age: 28,
    previousTeam: "Mumbai Indians",
    specialty: "Express pace, death bowling",
    stats: {
      battingAverage: 12.63,
      economy: 7.13,
      wickets: 46,
      matches: 35,
    },
    imageUrl: "/assets/players/player51.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player52",
    name: "Nitish Rana",
    role: "Batsman",
    nationality: "Indian",
    age: 29,
    previousTeam: "Kolkata Knight Riders",
    specialty: "Middle-order, left-handed",
    stats: {
      battingAverage: 28.54,
      economy: 7.57,
      strikeRate: 134.56,
      runs: 2594,
      matches: 104,
    },
    imageUrl: "/assets/players/player52.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player53",
    name: "Rahul Tripathi",
    role: "Batsman",
    nationality: "Indian",
    age: 32,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Versatile batting, aggression",
    stats: {
      battingAverage: 26.96,
      economy: 0,
      strikeRate: 138.82,
      runs: 1853,
      matches: 84,
    },
    imageUrl: "/assets/players/player53.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player54",
    name: "Harshal Patel",
    role: "Bowler",
    nationality: "Indian",
    age: 32,
    previousTeam: "Royal Challengers Bangalore",
    specialty: "Slower balls, death bowling",
    stats: {
      battingAverage: 11.78,
      economy: 8.58,
      wickets: 105,
      matches: 87,
    },
    imageUrl: "/assets/players/player54.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player55",
    name: "Anrich Nortje",
    role: "Bowler",
    nationality: "South African",
    age: 29,
    previousTeam: "Delhi Capitals",
    specialty: "Express pace, hostility",
    stats: {
      battingAverage: 5.25,
      economy: 7.65,
      wickets: 47,
      matches: 30,
    },
    imageUrl: "/assets/players/player55.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player56",
    name: "Abdul Samad",
    role: "Batsman",
    nationality: "Indian",
    age: 21,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Power hitting, leg-spin",
    stats: {
      battingAverage: 14.73,
      economy: 12.25,
      strikeRate: 136.10,
      runs: 331,
      wickets: 1,
      matches: 36,
    },
    imageUrl: "/assets/players/player56.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player57",
    name: "Marco Jansen",
    role: "All-Rounder",
    nationality: "South African",
    age: 22,
    previousTeam: "Sunrisers Hyderabad",
    specialty: "Left-arm pace, batting ability",
    stats: {
      battingAverage: 11.33,
      economy: 8.65,
      wickets: 19,
      matches: 17,
    },
    imageUrl: "/assets/players/player57.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player58",
    name: "Rinku Singh",
    role: "Batsman",
    nationality: "Indian",
    age: 25,
    previousTeam: "Kolkata Knight Riders",
    specialty: "Finisher, left-handed",
    stats: {
      battingAverage: 28.40,
      economy: 0,
      strikeRate: 149.31,
      runs: 725,
      matches: 31,
    },
    imageUrl: "/assets/players/player58.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player59",
    name: "Venkatesh Iyer",
    role: "All-Rounder",
    nationality: "Indian",
    age: 28,
    previousTeam: "Kolkata Knight Riders",
    specialty: "Opening, medium pace",
    stats: {
      battingAverage: 26.50,
      economy: 8.53,
      strikeRate: 132.56,
      runs: 956,
      wickets: 3,
      matches: 36,
    },
    imageUrl: "/assets/players/player59.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player60",
    name: "Murugan Ashwin",
    role: "Bowler",
    nationality: "Indian",
    age: 32,
    previousTeam: "Mumbai Indians",
    specialty: "Leg spin, googly",
    stats: {
      battingAverage: 8.14,
      economy: 8.15,
      wickets: 34,
      matches: 38,
    },
    imageUrl: "/assets/players/player60.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player61",
    name: "Rahul Chahar",
    role: "Bowler",
    nationality: "Indian",
    age: 23,
    previousTeam: "Punjab Kings",
    specialty: "Leg spin, flight",
    stats: {
      battingAverage: 8.90,
      economy: 7.62,
      wickets: 59,
      matches: 54,
    },
    imageUrl: "/assets/players/player61.png",
    basePrice: 0.0001,
  },
  {
    playerId: "player62",
    name: "Tilak Varma",
    role: "Batsman",
    nationality: "Indian",
    age: 20,
    previousTeam: "Mumbai Indians",
    specialty: "Left-handed, middle-order",
    stats: {
      battingAverage: 36.52,
      economy: 0,
      strikeRate: 144.59,
      runs: 740,
      matches: 25,
    },
    imageUrl: "/assets/players/player62.png",
    basePrice: 0.0001,
  },
];

// Initialize player data - mark as ready
try {
  // Mark player data as initialized
  playersInitialized = true;
  console.log("Player data initialized successfully with", iplPlayers.length, "players");
} catch (error) {
  initializationError = true;
  lastError = error as Error;
  console.error("Error initializing player data:", error);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
  try {
    const newArray = [...array]; // Create a copy to avoid mutation
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  } catch (error) {
    console.error("Error shuffling player array:", error);
    return [...array]; // Return unshuffled copy in case of error
  }
}

/**
 * Get a default backup player for error cases
 */
function getDefaultPlayer(): PlayerInfo {
  return {
    playerId: "default1",
    name: "Default Player",
    role: "Batsman",
    nationality: "International",
    basePrice: 0.0001,
    stats: {
      matches: 50,
      runs: 1500,
      strikeRate: 145.5,
      battingAverage: 35.5,
      economy: 0
    },
    imageUrl: "https://ui-avatars.com/api/?name=Default+Player&background=1d2671&color=fff"
  };
}

/**
 * Asynchronously retrieves player information for a given player ID.
 *
 * @param playerId The ID of the player to retrieve information for.
 * @returns A promise that resolves to a PlayerInfo object containing the player's information or undefined if player not found.
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo | undefined> {
  try {
    if (initializationError) {
      console.warn("Using getPlayerInfo despite initialization error");
    }
    
    // Return a copy of the player to prevent mutation
    const player = iplPlayers.find(player => player.playerId === playerId);
    return player ? {...player} : undefined;
  } catch (error) {
    console.error("Error getting player info:", error);
    return getDefaultPlayer();
  }
}

/**
 * Get all available players
 * 
 * @returns A promise that resolves to an array of all players
 */
export async function getAllPlayers(): Promise<PlayerInfo[]> {
  try {
    if (initializationError) {
      console.warn("Using getAllPlayers despite initialization error");
    }
    
    // Return a deep copy of players to prevent mutation
    return iplPlayers.map(player => ({...player}));
  } catch (error) {
    console.error("Error getting all players:", error);
    return [getDefaultPlayer()];
  }
}

/**
 * Get a shuffled list of players
 */
export async function getShuffledPlayers(): Promise<PlayerInfo[]> {
  try {
    if (initializationError) {
      console.warn("Using getShuffledPlayers despite initialization error");
    }
    
    if (!playersInitialized || iplPlayers.length === 0) {
      console.warn("Player data not initialized or empty when getShuffledPlayers called");
      return [getDefaultPlayer()];
    }
    
    // Return a shuffled copy
    return shuffleArray(iplPlayers.map(player => ({...player})));
  } catch (error) {
    console.error("Error getting shuffled players:", error);
    return [getDefaultPlayer()];
  }
}

/**
 * Get team information for a given team ID.
 * 
 * @param teamId The ID of the team to retrieve information for.
 * @returns A promise that resolves to a TeamInfo object containing the team's information or undefined if team not found.
 */
export async function getTeamInfo(teamId: string): Promise<TeamInfo | undefined> {
  try {
    // Return a copy of the team to prevent mutation
    const team = iplTeams.find(team => team.teamId === teamId);
    return team ? {...team} : undefined;
  } catch (error) {
    console.error("Error getting team info:", error);
    return undefined;
  }
}

/**
 * Get all available teams
 * 
 * @returns A promise that resolves to an array of all teams
 */
export async function getAllTeams(): Promise<TeamInfo[]> {
  try {
    // Return a deep copy of teams to prevent mutation
    return iplTeams.map(team => ({...team}));
  } catch (error) {
    console.error("Error getting all teams:", error);
    return [];
  }
}

/**
 * Get all players for a specific team
 * 
 * @param teamId The ID of the team to retrieve players for
 * @returns A promise that resolves to an array of players in the specified team
 */
export async function getTeamPlayers(teamId: string): Promise<PlayerInfo[]> {
  try {
    // Return a deep copy of players filtered by team
    return iplPlayers
      .filter(player => player.teamId === teamId)
      .map(player => ({...player}));
  } catch (error) {
    console.error(`Error getting players for team ${teamId}:`, error);
    return [];
  }
}

/**
 * Assign a player to a team
 * 
 * @param playerId The ID of the player to assign
 * @param teamId The ID of the team to assign the player to
 * @returns A promise that resolves to the updated player or undefined if player not found
 */
export async function assignPlayerToTeam(playerId: string, teamId: string): Promise<PlayerInfo | undefined> {
  try {
    const playerIndex = iplPlayers.findIndex(player => player.playerId === playerId);
    if (playerIndex === -1) {
      console.warn(`Player ${playerId} not found`);
      return undefined;
    }
    
    // Update player's team
    iplPlayers[playerIndex].teamId = teamId;
    
    // Return a copy of the updated player
    return {...iplPlayers[playerIndex]};
  } catch (error) {
    console.error(`Error assigning player ${playerId} to team ${teamId}:`, error);
    return undefined;
  }
}
