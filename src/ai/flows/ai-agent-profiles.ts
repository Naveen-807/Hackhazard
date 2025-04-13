'use server';
/**
 * @fileOverview Defines AI agent profiles with distinct bidding strategies for the auction.
 *
 * - getAIAgentProfile - A function that returns an AI agent profile based on the agent ID.
 * - AIAgentProfileInput - The input type for the getAIAgentProfile function.
 * - AIAgentProfileOutput - The return type for the getAIAgentProfile function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

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

export async function getAIAgentProfile(input: AIAgentProfileInput): Promise<AIAgentProfileOutput> {
  return aiAgentProfileFlow(input);
}

const agentProfilesPrompt = ai.definePrompt({
  name: 'agentProfilesPrompt',
  input: {
    schema: z.object({
      agentId: z.string().describe('The ID of the AI agent.'),
    }),
  },
  output: {
    schema: z.object({
      agentName: z.string().describe('The name of the AI agent.'),
      strategyType: z.enum(['smart', 'aggressive', 'balanced']).describe('The bidding strategy type of the AI agent.'),
      description: z.string().describe('A brief description of the AI agent personality.'),
    }),
  },
  prompt: `You are an AI that defines profiles for AI agents participating in an IPL auction. Each agent represents an IPL team with a unique personality and bidding strategy.

Based on the agent ID, provide the team's name, a short description of their strategy, and their bidding strategy type (smart, aggressive, or balanced).

Here are the IPL Team profiles:

- Agent ID: mumbai_indians
  - Agent Name: Mumbai Indians
  - Description: Known for their strategic player acquisitions and building a strong core team.
  - Strategy Type: smart

- Agent ID: chennai_super_kings
  - Agent Name: Chennai Super Kings
  - Description: Focuses on experienced players and maintaining a balanced team composition.
  - Strategy Type: balanced

- Agent ID: royal_challengers_bangalore
  - Agent Name: Royal Challengers Bangalore
  - Description: Known for aggressive bidding on star players to create a high-profile team.
  - Strategy Type: aggressive

- Agent ID: kolkata_knight_riders
  - Agent Name: Kolkata Knight Riders
  - Description: Focuses on identifying undervalued players and building a versatile squad.
  - Strategy Type: smart

Now, based on the provided agent ID, return the profile.
Agent ID: {{{agentId}}}
`,
});

const aiAgentProfileFlow = ai.defineFlow<
  typeof AIAgentProfileInputSchema,
  typeof AIAgentProfileOutputSchema
>({
  name: 'aiAgentProfileFlow',
  inputSchema: AIAgentProfileInputSchema,
  outputSchema: AIAgentProfileOutputSchema,
},
async input => {
  const {output} = await agentProfilesPrompt(input);
  return output!;
});
