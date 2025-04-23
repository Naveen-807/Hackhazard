/**
 * Utility functions for bid calculations and recommendations
 * These functions are used by both client and server components
 */

/**
 * Calculate recommended bid amount based on player value and current bid
 * @param playerScore Player evaluation score (1-10)
 * @param currentBid Current highest bid
 * @param basePrice Base price of the player
 * @param remainingBudget Remaining budget of the bidder
 * @param strategy Bidding strategy ('aggressive', 'conservative', 'balanced')
 * @returns Recommended bid amount
 */
export function calculateRecommendedBid(
  playerScore: number, 
  currentBid: number,
  basePrice: number,
  remainingBudget: number,
  strategy: string
): number {
  // Minimum increment
  const minBidIncrement = 0.0001;

  // Base value calculation (ensure we never go below current bid + min increment)
  let recommendedBid = Math.max(currentBid + minBidIncrement, currentBid * 1.05);

  // Player value factor (higher player score = willing to bid more)
  const playerValueFactor = playerScore / 10; // Normalize to 0-1 range

  // Strategy-based adjustments
  let strategyMultiplier = 1.0;
  switch (strategy.toLowerCase()) {
    case 'aggressive':
      strategyMultiplier = 1.2;
      break;
    case 'conservative':
      strategyMultiplier = 0.9;
      break;
    case 'balanced':
    default:
      strategyMultiplier = 1.05;
      break;
  }

  // Scale bid based on player value and strategy
  recommendedBid = recommendedBid * (1 + playerValueFactor * 0.5) * strategyMultiplier;

  // Budget constraint - never recommend more than 40% of remaining budget for a single player
  // unless player is extremely valuable (8+ rating)
  const maxBudgetAllocation = playerScore >= 8 ? 0.6 : 0.4;
  const maxBasedOnBudget = remainingBudget * maxBudgetAllocation;
  
  // Take the lower of the calculated bid and budget constraint
  recommendedBid = Math.min(recommendedBid, maxBasedOnBudget);

  // Ensure minimum increment is maintained
  recommendedBid = Math.max(currentBid + minBidIncrement, recommendedBid);

  // Round to 4 decimal places (MONAD has 18 decimals, but UI shows 4)
  return Math.round(recommendedBid * 10000) / 10000;
}