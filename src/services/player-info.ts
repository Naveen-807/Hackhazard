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
   * Player ID.
   */
  playerId: string;
}

const playerRoles = ['Opener', 'Middle-Order Batsman', 'Fast Bowler', 'Spin Bowler', 'Wicket-Keeper'];

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
 * Generates a player name based on a given ID
 *
 * @param playerId The ID of the player
 * @returns A player name
 */
function generatePlayerName(playerId: string): string {
    return `Player ${playerId}`;
}

/**
 * Generates a random player with dynamic attributes.
 *
 * @param index The index of the player used to generate player ID.
 * @returns A PlayerInfo object with random attributes.
 */
function generateRandomPlayer(index: number): PlayerInfo {
  const playerId = `player${index + 1}`;
  const battingAverage = getRandomNumber(20, 60);
  const economy = getRandomNumber(6, 10);
  const basePrice = Math.floor(getRandomNumber(20000, 100000));
  const imageUrl = `https://picsum.photos/id/${index + 200}/200/300`;
  const role = playerRoles[Math.floor(Math.random() * playerRoles.length)];

  return {
    name: generatePlayerName(playerId),
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
