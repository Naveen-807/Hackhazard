'use server';
/**
 * @fileOverview Defines the AI bidding strategy for auction agents.
 *
 * - aiBiddingStrategy - A function that determines whether an AI agent should bid and how much.
 * - AiBiddingStrategyInput - The input type for the aiBiddingStrategy function.
 * - AiBiddingStrategyOutput - The return type for the aiBiddingStrategy function.
 */

import {generateText} from '@/ai/ai-instance';
import {z} from 'zod';
// Import the utility function from the non-server file
import { calculateRecommendedBid } from '@/lib/bid-utils';

const AiBiddingStrategyInputSchema = z.object({
  playerEvaluationScore: z.number().describe('Score evaluating the player value from 0-10.'),
  agentStrategyType: z.enum(['smart', 'aggressive', 'balanced']).describe('The bidding strategy type of the AI agent.'),
  teamNeedsScore: z.number().describe('Score evaluating how well the player fits team needs from 0-10.'),
  remainingBudget: z.number().describe('Remaining budget of the team in dollars.'),
  currentBid: z.number().describe('The current highest bid in dollars.'),
  basePrice: z.number().describe('The base price of the player in dollars.'),
});
export type AiBiddingStrategyInput = z.infer<typeof AiBiddingStrategyInputSchema>;

const AiBiddingStrategyOutputSchema = z.object({
  bidDecision: z.boolean().describe('Whether to bid on this player or not.'),
  bidAmount: z.number().describe('The amount to bid if bidding.'),
  reasoning: z.string().describe('Reasoning behind the bidding decision.'),
});
export type AiBiddingStrategyOutput = z.infer<typeof AiBiddingStrategyOutputSchema>;

export async function aiBiddingStrategy(input: AiBiddingStrategyInput): Promise<AiBiddingStrategyOutput> {
  // More intelligent bidding logic based on strategy type and MONAD values (which are small)
  // First determine if bidding makes sense based on player evaluation, budget, and team needs
  let bidDecision = false;
  let bidAmount = input.currentBid;
  let reasoning = "";
  
  // Make bidding decision based on player evaluation and team needs
  // Weight team needs more heavily to encourage bidding for needed positions
  const playerValueScore = (input.playerEvaluationScore * 0.6) + (input.teamNeedsScore * 0.4);
  
  // Different strategies have different thresholds for bidding
  // Lower thresholds to encourage more bidding
  const bidThreshold = 
    input.agentStrategyType === 'aggressive' ? 2.0 :  // Aggressive bids more often
    input.agentStrategyType === 'smart' ? 3.0 :       // Smart bids when it makes sense
    2.5;                                              // Balanced is somewhere in between
    
  // Decide to bid if player value exceeds threshold
  bidDecision = playerValueScore > bidThreshold;
  
  // Add randomness to bidding decisions to create unpredictability
  // 15% chance to bid even if below threshold (bidding fever)
  // 5% chance to not bid even if above threshold (strategic waiting)
  const randomFactor = Math.random();
  if (!bidDecision && randomFactor < 0.15) {
    bidDecision = true;
    reasoning = "Decided to join the bidding despite lower player value score due to competitive auction environment.";
  } else if (bidDecision && randomFactor > 0.95) {
    bidDecision = false;
    reasoning = "Strategically holding back despite player value to wait for better opportunities.";
  }
  
  // Also consider budget - don't bid if it would take more than 80% of remaining budget
  // Increased from 70% to 80% to allow more aggressive bidding
  if (input.currentBid > (input.remainingBudget * 0.8)) {
    bidDecision = false;
    reasoning = `Cannot bid because current bid (${input.currentBid}) exceeds 80% of remaining budget (${input.remainingBudget}).`;
    return { bidDecision, bidAmount, reasoning };
  }
  
  if (bidDecision) {
    // Calculate bid increment based on strategy type
    const incrementPercentage = 
      input.agentStrategyType === 'aggressive' ? 0.25 : // Aggressive bids 25% more
      input.agentStrategyType === 'smart' ? 0.12 :      // Smart bids 12% more
      0.18;                                             // Balanced bids 18% more
    
    // Enhanced increment calculation with greater randomness for more unpredictable bidding
    // Higher minimum increment to make bidding move faster
    const increment = Math.max(
      0.0003, // Increased minimum increment for faster bidding
      input.currentBid * incrementPercentage * (0.7 + Math.random() * 0.6)
    );
    
    // Round to 5 decimal places for MONAD
    bidAmount = Math.round((input.currentBid + increment) * 100000) / 100000;
    
    // Ensure bid doesn't exceed budget
    if (bidAmount > input.remainingBudget) {
      bidAmount = Math.round(input.remainingBudget * 0.95 * 100000) / 100000; // Use 95% of budget max
    }
    
    // Add chance of overbidding for high-value players
    if (playerValueScore > 7.5 && input.agentStrategyType === 'aggressive' && Math.random() > 0.7) {
      // Make a much larger jump in bid to try to secure the player
      const bigIncrement = input.currentBid * 0.4 * (0.8 + Math.random() * 0.4);
      bidAmount = Math.round((input.currentBid + bigIncrement) * 100000) / 100000;
      
      // Still ensure we don't exceed budget
      if (bidAmount > input.remainingBudget) {
        bidAmount = Math.round(input.remainingBudget * 0.95 * 100000) / 100000;
      }
      
      reasoning = `Aggressive overbid of ${bidAmount} to secure high-value player (score: ${playerValueScore.toFixed(1)}/10)`;
    } else {
      reasoning = `Decided to bid ${bidAmount} based on ${input.agentStrategyType} strategy. Player value score: ${playerValueScore.toFixed(1)}/10 exceeds threshold of ${bidThreshold}.`;
    }
  } else {
    reasoning = `Decided not to bid because player value score (${playerValueScore.toFixed(1)}/10) is below threshold (${bidThreshold}) or current bid is too high.`;
  }
  
  console.log(`AI Bidding Decision: ${bidDecision ? 'YES' : 'NO'}, Amount: ${bidAmount}, Strategy: ${input.agentStrategyType}, Reasoning: ${reasoning}`);
  
  return {
    bidDecision,
    bidAmount,
    reasoning
  };
}

