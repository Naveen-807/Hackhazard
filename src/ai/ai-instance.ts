import { OpenAI } from 'openai';
import { z } from 'zod';

// Flag to use mock data when API key is invalid
const USE_MOCK_DATA = process.env.GROQ_API_KEY ? false : true;

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
    console.log('Generating text with Groq model for prompt:', prompt.substring(0, 50) + '...');
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
    
    // General fallback
    return 'Unable to generate response. Please try again later.';
  }
}

/**
 * Function to generate bidding suggestions using Groq's LLM
 * This provides faster responses which is critical during live auctions
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
    const prompt = `You are an expert cricket auction bidding assistant. Give a concise bidding suggestion for:
    
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
4. A quick strategic tip

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
const ManualBiddingRecommendationInputSchema = z.object({
  player: z.object({
    name: z.string(),
    role: z.string().optional(),
    basePrice: z.number().optional(),
    stats: z.any().optional(),
  }),
  currentBid: z.number(),
  remainingBudget: z.number(),
  teamNeeds: z.string().optional(),
});

// Defining the types exported from the schema
export type ManualBiddingRecommendationInput = {
  playerName: string;
  playerRole: string;
  playerStats?: any;
  currentBid: number;
  remainingBudget: number;
  teamNeeds?: string;
  bidHistory?: any[];
};

export type ManualBiddingRecommendationOutput = {
  shouldBid: boolean;
  recommendedAmount: number;
  confidence?: number;
  reasoning?: string;
  reason?: string;
  playerValueAssessment?: string;
  strategicAdvice?: string;
  quickTip?: string;
};

/**
 * Function to get manual bidding recommendations
 * This is a wrapper around generateBiddingSuggestion with type transformations
 */
export async function getManualBiddingRecommendation(
  input: ManualBiddingRecommendationInput
): Promise<ManualBiddingRecommendationOutput> {
  try {
    const suggestion = await generateBiddingSuggestion(
      input.playerName,
      input.playerRole,
      input.currentBid,
      input.playerStats?.basePrice || input.currentBid,
      input.remainingBudget,
      input.playerStats
    );
    
    return {
      shouldBid: suggestion.shouldBid,
      recommendedAmount: suggestion.recommendedAmount,
      confidence: 7, // Default confidence level
      reasoning: suggestion.reason,
      playerValueAssessment: "Analysis based on player statistics and current market value.",
      strategicAdvice: suggestion.quickTip
    };
  } catch (error) {
    console.error("Error in manual bidding recommendation:", error);
    return {
      shouldBid: false,
      recommendedAmount: 0,
      confidence: 1,
      reasoning: "Error occurred while generating recommendation",
      playerValueAssessment: "Unable to assess player value due to system error",
      strategicAdvice: "Consider manual bidding until system recovers"
    };
  }
}

// Function to generate auction moderator commentary
export async function generateModeratorCommentary(
  playerName: string, 
  playerRole: string,
  sellingPrice: number, 
  winningTeam: string, 
  expectedValue?: number
) {
  try {
    // Check if we're in mock mode or have API issues
    if (USE_MOCK_DATA) {
      const valuePhrases = ["great value", "fair price", "premium price"];
      const teamPhrases = ["strong addition to", "key player for", "interesting choice for"];
      
      const randomValue = valuePhrases[Math.floor(Math.random() * valuePhrases.length)];
      const randomTeam = teamPhrases[Math.floor(Math.random() * teamPhrases.length)];
      
      return `${playerName} goes to ${winningTeam} for ${sellingPrice}! That's a ${randomValue} and will be a ${randomTeam} their squad.`;
    }
    
    const prompt = `You are an enthusiastic cricket auction moderator. Generate a short, exciting commentary (max 1-2 sentences) for a player just sold:

Player: ${playerName}
Role: ${playerRole}
Final selling price: ${sellingPrice}
Winning team: ${winningTeam}
${expectedValue ? `Expected value: ${expectedValue}` : ''}

Make it sound exciting, and include a brief comment on if this was a good deal based on the price.
Respond with just the commentary text, no additional formatting.`;

    const response = await ai.chat.completions.create({
      model: 'llama3-8b-8192', // Using the smaller model for faster responses
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });
    
    return response.choices[0]?.message?.content || `${playerName} has been sold to ${winningTeam} for ${sellingPrice}!`;
  } catch (error) {
    console.error('Error generating moderator commentary:', error);
    return `${playerName} has been sold to ${winningTeam} for ${sellingPrice}!`;
  }
}

// Export the schema and types
export { ManualBiddingRecommendationInputSchema };
