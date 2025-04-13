'use server';
/**
 * @fileOverview Implements an AI-powered bidding strategy for AI agents in an auction.
 *
 * - aiBiddingStrategy - A function that determines the bid amount based on player evaluation and agent strategy.
 * - AiBiddingStrategyInput - The input type for the aiBiddingStrategy function.
 * - AiBiddingStrategyOutput - The return type for the aiBiddingStrategy function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AiBiddingStrategyInputSchema = z.object({
  playerEvaluationScore: z.number().describe('The AI evaluation score of the player.'),
  agentStrategyType: z.enum(['smart', 'aggressive', 'balanced']).describe('The bidding strategy type of the AI agent.'),
  teamNeedsScore: z.number().describe('A score representing how well the player fits the team needs.'),
  remainingBudget: z.number().describe('The AI agent remaining budget.'),
  currentBid: z.number().describe('The current bid amount for the player.'),
  basePrice: z.number().describe('The base price of the player.'),
});
export type AiBiddingStrategyInput = z.infer<typeof AiBiddingStrategyInputSchema>;

const AiBiddingStrategyOutputSchema = z.object({
  bidDecision: z.boolean().describe('Whether the AI agent should bid or not.'),
  bidAmount: z.number().describe('The bid amount proposed by the AI agent.'),
  reason: z.string().describe('The reason for the bid decision.'),
});
export type AiBiddingStrategyOutput = z.infer<typeof AiBiddingStrategyOutputSchema>;

export async function aiBiddingStrategy(input: AiBiddingStrategyInput): Promise<AiBiddingStrategyOutput> {
  return aiBiddingStrategyFlow(input);
}

const biddingStrategyPrompt = ai.definePrompt({
  name: 'biddingStrategyPrompt',
  input: {
    schema: z.object({
      playerEvaluationScore: z.number().describe('The AI evaluation score of the player.'),
      agentStrategyType: z.enum(['smart', 'aggressive', 'balanced']).describe('The bidding strategy type of the AI agent.'),
      teamNeedsScore: z.number().describe('A score representing how well the player fits the team needs.'),
      remainingBudget: z.number().describe('The AI agent remaining budget.'),
      currentBid: z.number().describe('The current bid amount for the player.'),
      basePrice: z.number().describe('The base price of the player.'),
    }),
  },
  output: {
    schema: z.object({
      bidDecision: z.boolean().describe('Whether the AI agent should bid or not.'),
      bidAmount: z.number().describe('The bid amount proposed by the AI agent.'),
      reason: z.string().describe('The reason for the bid decision.'),
    }),
  },
  prompt: `You are an AI bidding strategist helping an AI agent decide whether to bid on a player in an auction.

  Here's the information you have:
  - Player Evaluation Score: {{playerEvaluationScore}}
  - Agent Strategy Type: {{agentStrategyType}}
  - Team Needs Score: {{teamNeedsScore}}
  - Remaining Budget: {{remainingBudget}}
  - Current Bid: {{currentBid}}
  - Base Price: {{basePrice}}

  Based on this information, decide whether the AI agent should bid and, if so, how much to bid.

  Consider the agent's strategy type when making your decision:
  - smart: Bid conservatively, focusing on high-value players that fit specific team needs.
  - aggressive: Bid actively, trying to secure as many valuable players as possible, potentially overbidding.
  - balanced: A mix of both, bidding strategically but also willing to take risks.

  Output the decision (true/false), the bid amount, and the reason for the decision.

  Ensure that the bid amount does not exceed the remaining budget.
`,
});

const aiBiddingStrategyFlow = ai.defineFlow<
  typeof AiBiddingStrategyInputSchema,
  typeof AiBiddingStrategyOutputSchema
>({
  name: 'aiBiddingStrategyFlow',
  inputSchema: AiBiddingStrategyInputSchema,
  outputSchema: AiBiddingStrategyOutputSchema,
},
async input => {
  const {output} = await biddingStrategyPrompt(input);
  return output!;
});

