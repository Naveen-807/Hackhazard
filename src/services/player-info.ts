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
}

const playerRoles = ['Opener', 'Middle-Order Batsman', 'Fast Bowler', 'Spin Bowler', 'Wicket-Keeper'];
const teamNames = ['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders'];

/**
 * Generates a random number within a specified range.
 *
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns A random number between min and max (inclusive).
 */
function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random player with dynamic attributes.
 *
 * @param index The index of the player used to generate player ID.
 * @returns A PlayerInfo object with random attributes.
 */
function generateRandomPlayer(index: number): PlayerInfo {
  const playerId = `player${index + 1}`;
    const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
  const battingAverage = getRandomNumber(20, 60);
  const economy = getRandomNumber(6, 10);
  const basePrice = Math.floor(getRandomNumber(20000, 100000));
  // Replace with a more reliable image URL or a placeholder
    const imageUrl = `https://source.unsplash.com/300x400/?cricketplayer,${teamName}`;
  const role = playerRoles[Math.floor(Math.random() * playerRoles.length)];

  return {
    name: `Player ${index + 1} (${teamName})`,
    role: role,
    stats: {
      battingAverage: parseFloat(battingAverage.toFixed(2)),
      economy: parseFloat(economy.toFixed(2)),
    },
    imageUrl: imageUrl,
    basePrice: basePrice,
    playerId: playerId,
  };
}

// Generate an array of 150 players
const allPlayers: PlayerInfo[] = Array.from({ length: 150 }, (_, index) => generateRandomPlayer(index));

/**
 * Asynchronously retrieves player information for a given player ID.
 *
 * @param playerId The ID of the player to retrieve information for.
 * @returns A promise that resolves to a PlayerInfo object containing the player's information or undefined if player not found.
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo | undefined> {
  return allPlayers.find(player => player.playerId === playerId);
}
