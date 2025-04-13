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
}

/**
 * Asynchronously retrieves player information for a given player ID.
 *
 * @param playerId The ID of the player to retrieve information for.
 * @returns A promise that resolves to a PlayerInfo object containing the player's information.
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo> {
  // TODO: Implement this by calling an API.

  return {
    name: 'Rohit Sharma',
    role: 'Opener',
    stats: {
      battingAverage: 45.6,
      economy: 8.2,
    },
    imageUrl: 'https://example.com/rohit-sharma.jpg',
  };
}
