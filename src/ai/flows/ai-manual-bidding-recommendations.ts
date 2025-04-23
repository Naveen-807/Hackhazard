'use server';
/**
 * @fileOverview Provides AI-powered recommendations for manual bidding during auction
 *
 * - getManualBiddingRecommendations - A function that returns bidding recommendations for users.
 * - ManualBiddingRecommendationRequest - The input type for the function.
 * - ManualBiddingRecommendationResponse - The return type for the function.
 */

import { 
  getManualBiddingRecommendation, 
  ManualBiddingRecommendationInput, 
  ManualBiddingRecommendationOutput 
} from '@/ai/ai-instance';
import { PlayerInfo } from '@/services/player-info';

export interface ManualBiddingRecommendationRequest {
  player: PlayerInfo;
  currentBid: number;
  remainingBudget: number;
  teamNeeds: string;
  bidHistory?: Array<{
    playerName: string;
    bidAmount: number;
    role: string;
  }>;
}

export interface ManualBiddingRecommendationResponse {
  shouldBid: boolean;
  recommendedBidAmount: number;
  confidence: number;
  reasoning: string;
  playerValueAssessment: string;
  strategicAdvice: string;
  error?: string;
}

/**
 * Provides AI-powered recommendations for manual bidding during an auction
 * 
 * @param request Information about the current auction situation
 * @returns AI recommendations for bidding
 */
export async function getManualBiddingAdvice(
  request: ManualBiddingRecommendationRequest
): Promise<ManualBiddingRecommendationResponse> {
  try {
    // Map the request to the input format expected by the AI function
    const input: ManualBiddingRecommendationInput = {
      playerName: request.player.name,
      playerRole: request.player.role || 'Unknown',
      playerStats: {
        battingAverage: request.player.stats?.battingAverage,
        strikeRate: request.player.stats?.strikeRate,
        wickets: request.player.stats?.wickets,
        economy: request.player.stats?.economy,
        matches: request.player.stats?.matches
      },
      currentBid: request.currentBid,
      remainingBudget: request.remainingBudget,
      teamNeeds: request.teamNeeds,
      bidHistory: request.bidHistory
    };

    // Get recommendation from the AI
    const recommendation = await getManualBiddingRecommendation(input);
    return recommendation;
  } catch (error) {
    console.error('Error getting manual bidding advice:', error);
    
    // Return a fallback response with error information
    return {
      shouldBid: false,
      recommendedBidAmount: request.currentBid * 1.1,
      confidence: 1,
      reasoning: 'Unable to generate recommendation due to technical issues.',
      playerValueAssessment: 'Assessment unavailable due to error.',
      strategicAdvice: 'Consider manual decision making until the system is back online.',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}