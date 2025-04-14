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
  // Simple bidding logic based on strategy type
  const bidDecision = Math.random() > 0.5; // 50% chance to bid
  
  let bidAmount = input.currentBid;
  let reasoning = "";
  
  if (bidDecision) {
    // Calculate bid increment based on strategy type
    const incrementPercentage = 
      input.agentStrategyType === 'aggressive' ? 0.2 : 
      input.agentStrategyType === 'smart' ? 0.1 : 0.15;
    
    // Calculate bid increment with some randomness
    const increment = Math.max(
      10000, // Minimum increment
      Math.floor(input.currentBid * incrementPercentage * (0.8 + Math.random() * 0.4))
    );
    
    bidAmount = input.currentBid + increment;
    
    // Ensure bid doesn't exceed budget
    if (bidAmount > input.remainingBudget) {
      bidAmount = input.remainingBudget;
    }
    
    reasoning = `Decided to bid ${bidAmount} based on ${input.agentStrategyType} strategy. Player evaluation: ${input.playerEvaluationScore}/10, team needs: ${input.teamNeedsScore}/10.`;
  } else {
    reasoning = `Decided not to bid because current bid is too high or player doesn't meet team requirements. Current bid: ${input.currentBid}, player evaluation: ${input.playerEvaluationScore}/10.`;
  }
  
  return {
    bidDecision,
    bidAmount,
    reasoning
  };
  
  // For a more sophisticated approach using AI (currently disabled to save API calls):
  /*
  const prompt = `You are an AI that makes bidding decisions for IPL teams in a player auction.
  
  Based on the following information, decide whether to bid and how much:
  - Player Evaluation Score (0-10): ${input.playerEvaluationScore}
  - Agent Strategy Type: ${input.agentStrategyType}
  - Team Needs Score (0-10): ${input.teamNeedsScore}
  - Remaining Budget: $${input.remainingBudget}
  - Current Bid: $${input.currentBid}
  - Base Price: $${input.basePrice}
  
  The response should be in valid JSON format with the following fields:
  - bidDecision: boolean (whether to bid or not)
  - bidAmount: number (the amount to bid if bidding)
  - reasoning: string (explanation for the decision)
  `;

  const result = await generateText(prompt);
  
  try {
    const parsedResult = JSON.parse(result);
    return AiBiddingStrategyOutputSchema.parse(parsedResult);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return {
      bidDecision: false,
      bidAmount: input.currentBid,
      reasoning: "Unable to determine a bidding strategy due to processing error."
    };
  }
  */
}

