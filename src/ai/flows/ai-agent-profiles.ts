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
  prompt: `You are an AI that defines profiles for AI agents participating in an IPL auction. Each agent has a unique personality and bidding strategy.

Based on the agent ID, provide the agent's name, a short description of their personality, and their bidding strategy type (smart, aggressive, or balanced).

Here are some example agent profiles:

- Agent ID: agent1
  - Agent Name: Prudent Paul
  - Description: A cautious agent who carefully evaluates each player and only bids when they see exceptional value.
  - Strategy Type: smart

- Agent ID: agent2
  - Agent Name: Risky Ricky
  - Description: An agent who loves the thrill of the auction and isn't afraid to take risks, often overbidding to secure a player they want.
  - Strategy Type: aggressive

- Agent ID: agent3
  - Agent Name: Steady Sam
  - Description: A balanced agent who combines careful evaluation with a willingness to bid strategically, adapting their approach as the auction unfolds.
  - Strategy Type: balanced

- Agent ID: agent4
  - Agent Name: Bargain Bella
  - Description: Focuses on finding undervalued players and securing them at a bargain price.
  - Strategy Type: smart

Now, based on the provided agent ID, create a profile with a unique name, personality description, and bidding strategy type.
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
