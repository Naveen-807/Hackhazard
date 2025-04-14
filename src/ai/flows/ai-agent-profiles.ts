'use server';
/**
 * @fileOverview Defines AI agent profiles with distinct bidding strategies for the auction.
 *
 * - getAIAgentProfile - A function that returns an AI agent profile based on the agent ID.
 * - AIAgentProfileInput - The input type for the getAIAgentProfile function.
 * - AIAgentProfileOutput - The return type for the getAIAgentProfile function.
 */

import {generateText} from '@/ai/ai-instance';
import {z} from 'zod';

const AIAgentProfileInputSchema = z.object({
  agentId: z.string().describe('The ID of the AI agent.'),
});
export type AIAgentProfileInput = z.infer<typeof AIAgentProfileInputSchema>;

const AIAgentProfileOutputSchema = z.object({
  agentName: z.string().describe('The name of the AI agent.'),
  strategyType: z.enum(['smart', 'aggressive', 'balanced']).describe('The bidding strategy type of the AI agent.'),
  description: z.string().describe('A brief description of the AI agent personality.'),
});
export type AIAgentProfileOutput = z.infer<typeof AIAgentProfileOutputSchema>;

// Pre-defined team profiles to avoid unnecessary API calls
const teamProfiles: Record<string, AIAgentProfileOutput> = {
  mumbai_indians: {
    agentName: "Mumbai Indians",
    strategyType: "smart",
    description: "Known for their strategic player acquisitions and building a strong core team."
  },
  chennai_super_kings: {
    agentName: "Chennai Super Kings",
    strategyType: "balanced",
    description: "Focuses on experienced players and maintaining a balanced team composition."
  },
  royal_challengers_bangalore: {
    agentName: "Royal Challengers Bangalore",
    strategyType: "aggressive",
    description: "Known for aggressive bidding on star players to create a high-profile team."
  },
  kolkata_knight_riders: {
    agentName: "Kolkata Knight Riders",
    strategyType: "smart",
    description: "Focuses on identifying undervalued players and building a versatile squad."
  }
};

export async function getAIAgentProfile(input: AIAgentProfileInput): Promise<AIAgentProfileOutput> {
  // Return pre-defined team profile if available
  if (teamProfiles[input.agentId]) {
    return teamProfiles[input.agentId];
  }
  
  // If not available, generate a profile using the AI
  const prompt = `You are an AI that defines profiles for AI agents participating in an IPL auction. Each agent represents an IPL team with a unique personality and bidding strategy.

Based on the agent ID, provide the team's name, a short description of their strategy, and their bidding strategy type (smart, aggressive, or balanced).

The response should be in valid JSON format with the following fields:
- agentName: string
- strategyType: "smart" | "aggressive" | "balanced"
- description: string

Agent ID: ${input.agentId}`;

  const result = await generateText(prompt);
  
  try {
    // Try to parse the JSON response
    const parsedResult = JSON.parse(result);
    return AIAgentProfileOutputSchema.parse(parsedResult);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    // Return a default profile if parsing fails
    return {
      agentName: input.agentId,
      strategyType: "balanced",
      description: "A team with a balanced approach to player selection and bidding strategy."
    };
  }
}
