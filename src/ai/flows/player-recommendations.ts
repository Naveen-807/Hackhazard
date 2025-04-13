'use server';
/**
 * @fileOverview A flow to provide player recommendations with reasons.
 *
 * - getPlayerRecommendations - A function that returns player recommendations with reasons.
 * - PlayerRecommendationsInput - The input type for the getPlayerRecommendations function.
 * - PlayerRecommendationsOutput - The return type for the getPlayerRecommendations function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getPlayerInfo, PlayerInfo} from '@/services/player-info';

const PlayerRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting recommendations.'),
  currentTeam: z.array(z.string()).optional().describe('The list of playerIds in the current team.'),
  budget: z.number().describe('The remaining budget of the user.'),
});
export type PlayerRecommendationsInput = z.infer<typeof PlayerRecommendationsInputSchema>;

const PlayerRecommendationSchema = z.object({
  playerId: z.string().describe('The ID of the recommended player.'),
  reason: z.string().describe('The reason for recommending this player.'),
});

const PlayerRecommendationsOutputSchema = z.object({
  recommendations: z.array(PlayerRecommendationSchema).describe('A list of recommended players with reasons.'),
});
export type PlayerRecommendationsOutput = z.infer<typeof PlayerRecommendationsOutputSchema>;

export async function getPlayerRecommendations(input: PlayerRecommendationsInput): Promise<PlayerRecommendationsOutput> {
  return playerRecommendationsFlow(input);
}

const playerRecommendationsPrompt = ai.definePrompt({
  name: 'playerRecommendationsPrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user requesting recommendations.'),
      currentTeam: z.array(z.string()).optional().describe('The list of playerIds in the current team.'),
      budget: z.number().describe('The remaining budget of the user.'),
    }),
  },
  output: {
    schema: z.object({
      recommendations: z.array(z.object({
        playerId: z.string().describe('The ID of the recommended player.'),
        reason: z.string().describe('The reason for recommending this player.'),
      })).describe('A list of recommended players with reasons.'),
    }),
  },
  prompt: `You are an AI assistant that provides player recommendations for a user in an IPL auction. Consider their current team composition, remaining budget, and suggest players that would be a good fit, along with a reason for each recommendation.

User ID: {{{userId}}}
Current Team: {{#if currentTeam}}{{#each currentTeam}}- {{{this}}}{{/each}}{{else}}No players in the current team{{/if}}
Budget: {{{budget}}}

Provide a list of player recommendations with a reason for each. Format your response as a JSON array of objects, where each object has a 'playerId' and a 'reason' field.
`,
});

const playerRecommendationsFlow = ai.defineFlow<
  typeof PlayerRecommendationsInputSchema,
  typeof PlayerRecommendationsOutputSchema
>({
  name: 'playerRecommendationsFlow',
  inputSchema: PlayerRecommendationsInputSchema,
  outputSchema: PlayerRecommendationsOutputSchema,
}, async input => {
  const {output} = await playerRecommendationsPrompt(input);
  return output!;
});
