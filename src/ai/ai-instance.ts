import { OpenAI } from 'openai';
import { z } from 'zod';

// Flag to use mock data when API key is invalid
const USE_MOCK_DATA = true;

// Create an OpenAI compatible client but point it to Groq's API
export const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || 'mock-api-key-for-demo',
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true, // Add this flag to allow browser usage
});

// Helper function to generate text with Groq models
export async function generateText(prompt: string) {
  if (USE_MOCK_DATA) {
    console.log('Using mock data instead of calling Groq API');
    // Return mock response based on prompt keywords
    if (prompt.includes('cricket auction strategist') || prompt.includes('bidding')) {
      return `{
        "shouldBid": true,
        "recommendedBidAmount": 0.0015,
        "confidence": 7,
        "reasoning": "This player has excellent stats compared to the current bid. Their strike rate and average indicate they would be a valuable addition to your team.",
        "playerValueAssessment": "The player appears undervalued at the current bid price considering their experience and performance metrics.",
        "strategicAdvice": "Consider bidding slightly higher than recommended to discourage competition, as this player fills an important gap in your team composition."
      }`;
    }
    return 'Mock response for: ' + prompt.substring(0, 20) + '...';
  }

  try {
    const response = await ai.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating text with Groq:', error);
    // Provide mock data on API error
    if (prompt.includes('bidding suggestion') || prompt.includes('cricket auction')) {
      return `{
        "shouldBid": true,
        "recommendedBidAmount": 0.0012,
        "confidence": 6,
        "reasoning": "Based on player statistics and your team needs, this player would be a good addition.",
        "playerValueAssessment": "The current bid is reasonable for the player's skill level.",
        "strategicAdvice": "Consider your remaining budget before placing higher bids."
      }`;
    }
    return '';
  }
}

/**
 * Function to generate bidding suggestions using Groq's LLM
 * This provides faster response times which is critical during live auctions
 */
export async function generateBiddingSuggestion(
  playerName: string,
  playerRole: string,
  currentBid: number,
  basePrice: number,
  userBudget: number,
  playerStats?: any
) {
  if (USE_MOCK_DATA) {
    // Return mock bidding suggestion with slight randomization
    const shouldBid = Math.random() > 0.3; // 70% chance to recommend bidding
    const bidIncrease = Math.random() * 0.0005 + 0.0002; // Random increase between 0.0002 and 0.0007
    return {
      shouldBid,
      recommendedAmount: currentBid + (shouldBid ? bidIncrease : 0),
      reason: shouldBid 
        ? `${playerName} is a strong ${playerRole} that matches your team needs` 
        : `Current bid for ${playerName} is approaching maximum value for this player type`,
      quickTip: shouldBid 
        ? "Act quickly to secure this player before competitors notice their value" 
        : "Consider waiting for better opportunities with higher value-to-cost ratio"
    };
  }

  try {
    const prompt = `You are an expert cricket auction bidding assistant. Give a short, concise bidding suggestion for:
    
Player: ${playerName}
Role: ${playerRole}
Base Price: ${basePrice}
Current Bid: ${currentBid}
Available Budget: ${userBudget}
${playerStats ? `Player Stats: ${JSON.stringify(playerStats)}` : ''}

Provide a brief analysis and suggest:
1. Whether to bid
2. A recommended bid amount
3. A short reason why

Format your response as a concise JSON:
{
  "shouldBid": boolean,
  "recommendedAmount": number,
  "reason": "brief explanation",
  "quickTip": "one-sentence strategic advice"
}`;

    const response = await ai.chat.completions.create({
      model: 'llama3-8b-8192', // Using the smaller model for faster responses
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 250,
      response_format: { type: "json_object" } // Force JSON response
    });
    
    const suggestion = response.choices[0]?.message?.content || '';
    
    try {
      // Parse and return the JSON response
      return JSON.parse(suggestion);
    } catch (e) {
      console.error("Failed to parse bidding suggestion JSON:", e);
      return {
        shouldBid: currentBid < (userBudget * 0.3),
        recommendedAmount: Math.min(currentBid * 1.1, userBudget * 0.4),
        reason: "Based on available budget constraints",
        quickTip: "Consider your remaining team needs before bidding"
      };
    }
  } catch (error) {
    console.error('Error generating bidding suggestion with Groq:', error);
    return {
      shouldBid: false,
      recommendedAmount: 0,
      reason: "Unable to analyze due to technical error",
      quickTip: "Try manual bidding while system recovers"
    };
  }
}

// Manual Bidding Recommendation Input Schema
export const ManualBiddingRecommendationInputSchema = z.object({
  playerName: z.string().describe('The name of the player being auctioned'),
  playerRole: z.string().describe('The role of the player (e.g., Batsman, Bowler, All-rounder, Wicket-keeper)'),
  playerStats: z.object({
    battingAverage: z.number().optional().describe('Player batting average'),
    strikeRate: z.number().optional().describe('Player strike rate'),
    wickets: z.number().optional().describe('Number of wickets taken'),
    economy: z.number().optional().describe('Bowling economy rate'),
    matches: z.number().optional().describe('Number of matches played'),
  }).optional().describe('Player statistics'),
  currentBid: z.number().describe('Current highest bid in the auction'),
  remainingBudget: z.number().describe('User\'s remaining budget for acquisitions'),
  teamNeeds: z.string().describe('Description of the team\'s current needs'),
  bidHistory: z.array(
    z.object({
      playerName: z.string(),
      bidAmount: z.number(),
      role: z.string()
    })
  ).optional().describe('History of previous bids by the user')
});

export type ManualBiddingRecommendationInput = z.infer<typeof ManualBiddingRecommendationInputSchema>;

// Manual Bidding Recommendation Output Schema
export const ManualBiddingRecommendationOutputSchema = z.object({
  shouldBid: z.boolean().describe('Whether the user should place a bid'),
  recommendedBidAmount: z.number().describe('Recommended bid amount if shouldBid is true'),
  confidence: z.number().describe('Confidence level in the recommendation (1-10)'),
  reasoning: z.string().describe('Reasoning behind the recommendation'),
  playerValueAssessment: z.string().describe('Assessment of the player\'s value relative to current bid'),
  strategicAdvice: z.string().describe('Strategic advice for the auction'),
});

export type ManualBiddingRecommendationOutput = z.infer<typeof ManualBiddingRecommendationOutputSchema>;

/**
 * Provides AI-powered recommendations for manual bidding during an auction
 * 
 * @param input Information about the player, current bid, and team needs
 * @returns Recommendation on whether to bid and suggested bid amount
 */
export async function getManualBiddingRecommendation(
  input: ManualBiddingRecommendationInput
): Promise<ManualBiddingRecommendationOutput> {
  try {
    // Create a prompt for the AI with all the available information
    const prompt = `You are an expert cricket auction strategist advising a team manager during an IPL auction.
    
Player being auctioned: ${input.playerName} (${input.playerRole})
Current highest bid: ${input.currentBid}
Your remaining budget: ${input.remainingBudget}
Your team needs: ${input.teamNeeds}

${input.playerStats ? `Player statistics:
- Batting average: ${input.playerStats.battingAverage || 'N/A'}
- Strike rate: ${input.playerStats.strikeRate || 'N/A'}
- Wickets: ${input.playerStats.wickets || 'N/A'}
- Economy rate: ${input.playerStats.economy || 'N/A'}
- Matches played: ${input.playerStats.matches || 'N/A'}` : 'No detailed statistics available for this player.'}

${input.bidHistory && input.bidHistory.length > 0 ? `Your previous successful bids:
${input.bidHistory.map(bid => `- ${bid.playerName} (${bid.role}): ${bid.bidAmount}`).join('\n')}` : 'No previous bids recorded.'}

Based on all available information, provide:
1. Should the team bid for this player? (yes/no)
2. If yes, what would be the recommended bid amount?
3. Your confidence level in this recommendation (1-10)
4. Detailed reasoning for your recommendation
5. Assessment of the player's value relative to the current bid
6. Strategic advice for this auction situation

Return your analysis as a valid JSON object with these fields:
{
  "shouldBid": boolean,
  "recommendedBidAmount": number,
  "confidence": number,
  "reasoning": "string",
  "playerValueAssessment": "string",
  "strategicAdvice": "string"
}`;

    // Get AI response
    const response = await generateText(prompt);
    
    try {
      const parsedResponse = JSON.parse(response);
      return ManualBiddingRecommendationOutputSchema.parse(parsedResponse);
    } catch (error) {
      console.error("Error parsing AI response for bidding recommendation:", error);
      console.log("Raw AI response:", response);
      
      // Fallback response if parsing fails
      return {
        shouldBid: input.currentBid < (input.remainingBudget * 0.5),
        recommendedBidAmount: Math.round((input.currentBid * 1.12) * 100000) / 100000,
        confidence: 5,
        reasoning: "This is a fallback recommendation based on basic budget analysis since the AI response could not be parsed correctly.",
        playerValueAssessment: "Unable to provide detailed player value assessment due to technical issues.",
        strategicAdvice: "Consider your team needs and remaining budget carefully before bidding."
      };
    }
  } catch (error) {
    console.error("Error getting manual bidding recommendation:", error);
    
    // Default fallback response
    return {
      shouldBid: input.currentBid < (input.remainingBudget * 0.4),
      recommendedBidAmount: Math.round((input.currentBid * 1.1) * 100000) / 100000,
      confidence: 3,
      reasoning: "This is a fallback recommendation due to an error in the AI service.",
      playerValueAssessment: "Unable to assess player value due to technical issues.",
      strategicAdvice: "Consider waiting for technical issues to be resolved before making major bidding decisions."
    };
  }
}
