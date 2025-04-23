import { ethers } from "ethers";
import { BotWallet, getBotSigner, MODERATOR_ADDRESS } from "./bot-wallets";
import { placeBid } from "./auction-contract";
import { PlayerInfo } from "@/services/player-info";
import axios from "axios";
import { io as socketIOClient, Socket } from "socket.io-client";

// Enhanced AI agent types
export type TeamStrength = 'batting' | 'bowling' | 'all-rounder' | 'balanced';
export type BidStrategy = 'aggressive' | 'balanced' | 'conservative' | 'smart';
export type BidPreference = 'experienced' | 'young-talent' | 'versatile' | 'specialist';

export interface TeamPersonality {
  primaryStrength: TeamStrength;
  secondaryStrength: TeamStrength;
  bidStrategy: BidStrategy;
  preference: BidPreference;
  maxBidPercentOfBalance: number; // 0-1 (e.g., 0.7 = 70% of wallet)
  minBidIncrement: number; // 0-1 (e.g., 0.1 = 10% increment)
  maxBidIncrement: number; // 0-1 (e.g., 0.25 = 25% increment)
  description: string;
  logo: string;
  color: string; // Team primary color
  secondaryColor: string; // Team secondary color
}

// Specific team personalities with their bidding behaviors
export const teamPersonalities: Record<string, TeamPersonality> = {
  'Mumbai Indians': {
    primaryStrength: 'batting',
    secondaryStrength: 'bowling',
    bidStrategy: 'smart',
    preference: 'experienced',
    maxBidPercentOfBalance: 0.75,
    minBidIncrement: 0.05,
    maxBidIncrement: 0.20,
    description: 'Known for strategic purchases and building a strong core team',
    logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Roundbig/MIroundbig.png',
    color: '#004BA0',
    secondaryColor: '#D1AB3E'
  },
  'Chennai Super Kings': {
    primaryStrength: 'balanced',
    secondaryStrength: 'batting',
    bidStrategy: 'conservative',
    preference: 'experienced',
    maxBidPercentOfBalance: 0.60,
    minBidIncrement: 0.05,
    maxBidIncrement: 0.15,
    description: 'Focus on experienced players and team stability',
    logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png',
    color: '#FDB913',
    secondaryColor: '#0081C5'
  },
  'Royal Challengers Bangalore': {
    primaryStrength: 'batting',
    secondaryStrength: 'all-rounder',
    bidStrategy: 'aggressive',
    preference: 'specialist',
    maxBidPercentOfBalance: 0.85,
    minBidIncrement: 0.10,
    maxBidIncrement: 0.30,
    description: 'Aggressive bidding on star players',
    logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Roundbig/RCBroundbig.png',
    color: '#EC1C24',
    secondaryColor: '#000000'
  },
  'Kolkata Knight Riders': {
    primaryStrength: 'bowling',
    secondaryStrength: 'all-rounder',
    bidStrategy: 'smart',
    preference: 'versatile',
    maxBidPercentOfBalance: 0.70,
    minBidIncrement: 0.05,
    maxBidIncrement: 0.20,
    description: 'Identifying undervalued players and building a versatile squad',
    logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Roundbig/KKRroundbig.png',
    color: '#3A225D',
    secondaryColor: '#B3A123'
  },
  // Default team for users who aren't associated with any specific team
  'Default Team': {
    primaryStrength: 'balanced',
    secondaryStrength: 'balanced',
    bidStrategy: 'balanced',
    preference: 'versatile',
    maxBidPercentOfBalance: 0.80,
    minBidIncrement: 0.05,
    maxBidIncrement: 0.20,
    description: 'A balanced approach to team building with versatile players',
    logo: 'https://ui-avatars.com/api/?name=My+Team&background=1d2671&color=fff',
    color: '#1d2671',
    secondaryColor: '#C33764'
  }
};

// Calculate player match score based on team personality (0-10)
// Using deterministic algorithm to avoid hydration errors
export function calculatePlayerMatchScore(player: PlayerInfo, teamPersonality: TeamPersonality): number {
  if (!player || !teamPersonality) return 0;
  
  let score = 5; // Start with neutral score
  
  // Adjust based on role match with team's primary strength
  if (teamPersonality.primaryStrength === 'batting' && 
     (player.role === 'Batsman' || player.role === 'Wicket-keeper' || player.role?.includes('Batter'))) {
    score += 2;
  } else if (teamPersonality.primaryStrength === 'bowling' && 
     (player.role === 'Bowler' || player.role?.includes('Bowler'))) {
    score += 2;
  } else if (teamPersonality.primaryStrength === 'all-rounder' && 
     (player.role === 'All-rounder' || player.role?.includes('All'))) {
    score += 2;
  }
  
  // Adjust based on secondary strength
  if (teamPersonality.secondaryStrength === 'batting' && 
     (player.role === 'Batsman' || player.role === 'Wicket-keeper' || player.role?.includes('Batter'))) {
    score += 1;
  } else if (teamPersonality.secondaryStrength === 'bowling' && 
     (player.role === 'Bowler' || player.role?.includes('Bowler'))) {
    score += 1;
  } else if (teamPersonality.secondaryStrength === 'all-rounder' && 
     (player.role === 'All-rounder' || player.role?.includes('All'))) {
    score += 1;
  }
  
  // Adjust based on player experience and team preference
  if (player.age && teamPersonality.preference === 'experienced' && player.age > 28) {
    score += 1.5;
  } else if (player.age && teamPersonality.preference === 'young-talent' && player.age < 27) {
    score += 1.5;
  }
  
  // Adjust for player stats - using deterministic calculations
  if (player.stats) {
    // For batting-focused teams, value batting stats more
    if (teamPersonality.primaryStrength === 'batting' || teamPersonality.secondaryStrength === 'batting') {
      if (player.stats.battingAverage && player.stats.battingAverage > 30) {
        score += Math.min(2, (player.stats.battingAverage - 30) / 10); // Add up to 2 points
      }
      if (player.stats.strikeRate && player.stats.strikeRate > 130) {
        score += Math.min(2, (player.stats.strikeRate - 130) / 30); // Add up to 2 points
      }
    }
    
    // For bowling-focused teams, value bowling stats more
    if (teamPersonality.primaryStrength === 'bowling' || teamPersonality.secondaryStrength === 'bowling') {
      if (player.stats.wickets && player.stats.wickets > 50) {
        score += Math.min(2, player.stats.wickets / 50); // Add up to 2 points
      }
      if (player.stats.economy && player.stats.economy < 8) {
        score += Math.min(2, (8 - player.stats.economy) / 2); // Add up to 2 points
      }
    }
  }
  
  // Cap at 10 and ensure minimum of 1
  return Math.min(Math.max(score, 1), 10);
}

// Calculates the next bid amount based on team personality
export function calculateBidAmount(
  currentBid: number,
  botWallet: BotWallet,
  player: PlayerInfo,
  matchScore: number 
): number | null {
  // Get team personality
  const teamPersonality = teamPersonalities[botWallet.name] || teamPersonalities['Default Team'];
  
  // Calculate bid increment percentage based on match score and strategy
  const baseIncrementPercent = teamPersonality.minBidIncrement;
  const maxIncrementPercent = teamPersonality.maxBidIncrement;
  
  // Scale increment based on match score (higher score = higher increment)
  const scoreRatio = matchScore / 10;
  const incrementPercent = baseIncrementPercent + (maxIncrementPercent - baseIncrementPercent) * scoreRatio;
  
  // Apply strategy modifier to increment - using deterministic calculation
  const strategyModifier = teamPersonality.bidStrategy === 'aggressive' ? 1.3 :
                          teamPersonality.bidStrategy === 'conservative' ? 0.7 :
                          teamPersonality.bidStrategy === 'smart' ? (matchScore > 7 ? 1.2 : 0.8) : 1.0;
  
  // Calculate final increment
  const finalIncrement = currentBid * incrementPercent * strategyModifier;
  let bidAmount = currentBid + finalIncrement;
  
  // Don't exceed max percentage of wallet balance
  const maxBid = botWallet.balance * teamPersonality.maxBidPercentOfBalance;
  if (bidAmount > maxBid) {
    return maxBid > currentBid ? maxBid : null;
  }
  
  // Round to 5 decimal places
  return Math.round(bidAmount * 100000) / 100000;
}

// Function to decide if bot should bid based on team personality
export function shouldBid(
  currentBid: number,
  botWallet: BotWallet,
  player: PlayerInfo
): boolean {
  // Safety checks
  if (botWallet.balance <= currentBid || !player) return false;
  
  // Get team personality
  const teamPersonality = teamPersonalities[botWallet.name] || teamPersonalities['Default Team'];
  
  // Calculate player match score for this team
  const matchScore = calculatePlayerMatchScore(player, teamPersonality);
  
  // Define threshold based on strategy
  let threshold = 5; // Default neutral threshold
  
  switch(teamPersonality.bidStrategy) {
    case 'aggressive':
      threshold = 4; // Lower threshold means more willing to bid
      break;
    case 'conservative':
      threshold = 6.5; // Higher threshold means less willing to bid
      break;
    case 'smart':
      // Smart teams adjust threshold based on current bid vs their wallet
      threshold = 5 + (currentBid / botWallet.balance) * 5;
      break;
    case 'balanced':
    default:
      threshold = 5;
  }
  
  // Check if we have enough funds (with buffer)
  const minRequiredBalance = currentBid * 1.1; // 10% buffer
  if (botWallet.balance < minRequiredBalance) return false;
  
  // Make decision based on match score vs threshold
  return matchScore >= threshold;
}

// Class to manage an AI bidding agent
export class AiBiddingAgent {
  wallet: BotWallet;
  provider: ethers.Provider | null;
  personality: TeamPersonality;
  bidHistory: Array<{ auctionId: number, amount: number, timestamp: number }> = [];
  
  constructor(wallet: BotWallet, provider: ethers.Provider | null = null) {
    this.wallet = wallet;
    this.provider = provider;
    this.personality = teamPersonalities[wallet.name] || teamPersonalities['Default Team'];
  }
  
  setProvider(provider: ethers.Provider) {
    this.provider = provider;
  }
  
  // Process decision to bid on a player
  async evaluateAndBid(auctionId: number, player: PlayerInfo, currentBid: number, currentBidder: string, contract: any): Promise<{
    didBid: boolean;
    bidAmount?: number;
    reason?: string;
  }> {
    try {
      if (!this.provider) {
        return {
          didBid: false,
          reason: "No provider available"
        };
      }
      
      // Don't bid if already highest bidder
      if (currentBidder && currentBidder.toLowerCase() === this.wallet.address.toLowerCase()) {
        return { 
          didBid: false,
          reason: "Already highest bidder" 
        };
      }
      
      // Check if we should bid based on player match and strategy
      if (!shouldBid(currentBid, this.wallet, player)) {
        // Different reasons based on player match score
        const matchScore = calculatePlayerMatchScore(player, this.personality);
        let reason = "Player doesn't fit team strategy";
        if (matchScore >= 5) {
          reason = "Bid too high compared to team budget";
        }
        
        return { 
          didBid: false,
          reason 
        };
      }
      
      // Calculate bid amount
      const matchScore = calculatePlayerMatchScore(player, this.personality);
      const bidAmount = calculateBidAmount(currentBid, this.wallet, player, matchScore);
      
      if (bidAmount === null) {
        return { 
          didBid: false,
          reason: "Cannot afford to bid more" 
        };
      }
      
      // Get signer for this bot wallet
      const botSigner = await getBotSigner(this.provider, MODERATOR_ADDRESS);
      if (!botSigner) {
        return {
          didBid: false,
          reason: "Could not get bot signer"
        };
      }
      
      // Place bid (contract, auctionId, bidAmount, bidderAddress)
      const result = await contract.placeBid(contract, String(auctionId), String(bidAmount), this.wallet.address);
      
      if (result.success) {
        // Record bid in history
        this.bidHistory.push({
          auctionId,
          amount: bidAmount,
          timestamp: Date.now()
        });
        
        // Update wallet balance in memory (simulate deduction)
        this.wallet.balance = Math.max(0, this.wallet.balance - bidAmount);
        
        return {
          didBid: true,
          bidAmount,
          reason: `Bid placed for ${player.name}. Match score: ${matchScore.toFixed(1)}/10`
        };
      } else {
        return {
          didBid: false,
          reason: result.message || "Bid placement failed"
        };
      }
    } catch (error) {
      console.error(`Error in AI agent bidding for ${this.wallet.name}:`, error);
      return {
        didBid: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Initialize AI bidding agents for all teams - Server-safe initialization
export function initializeAIAgents(botWallets: BotWallet[]): AiBiddingAgent[] {
  return botWallets.map(wallet => new AiBiddingAgent(wallet));
}

// Centralized Auction Moderator Agent
export type AuctionState = {
  status: 'pending' | 'active' | 'ended' | 'completed';
  currentPlayerIndex: number;
  currentPlayer: PlayerInfo | null;
  players: PlayerInfo[];
  currentBid: number;
  currentBidder: string | null;
  bidHistory: Array<{ bidder: string; amount: number; timestamp: number }>;
  timer: number;
  error?: string;
};

export class AuctionModeratorAgent {
  private state: AuctionState;
  private timerInterval: NodeJS.Timeout | null = null;
  private readonly bidTimeoutSeconds: number = 15;
  private readonly onStateChange: (state: AuctionState) => void;

  constructor(players: PlayerInfo[], onStateChange: (state: AuctionState) => void) {
    this.state = {
      status: 'pending',
      currentPlayerIndex: 0,
      currentPlayer: players.length > 0 ? players[0] : null,
      players,
      currentBid: players.length > 0 ? players[0].basePrice : 0,
      currentBidder: null,
      bidHistory: [],
      timer: this.bidTimeoutSeconds,
    };
    this.onStateChange = onStateChange;
  }

  startAuction() {
    if (this.state.status !== 'pending') return;
    this.state.status = 'active';
    this.state.currentPlayerIndex = 0;
    this.state.currentPlayer = this.state.players[0] || null;
    this.state.currentBid = this.state.currentPlayer ? this.state.currentPlayer.basePrice : 0;
    this.state.currentBidder = null;
    this.state.bidHistory = [];
    this.state.timer = this.bidTimeoutSeconds;
    this.onStateChange(this.state);
    this.startTimer();
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.state.timer -= 1;
      if (this.state.timer <= 0) {
        this.endCurrentAuction();
      } else {
        this.onStateChange(this.state);
      }
    }, 1000);
  }

  placeBid(bidder: string, amount: number) {
    if (this.state.status !== 'active' || !this.state.currentPlayer) return false;
    if (amount <= this.state.currentBid) return false;
    this.state.currentBid = amount;
    this.state.currentBidder = bidder;
    this.state.bidHistory.push({ bidder, amount, timestamp: Date.now() });
    this.state.timer = this.bidTimeoutSeconds;
    this.onStateChange(this.state);
    return true;
  }

  private endCurrentAuction() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state.status = 'ended';
    this.onStateChange(this.state);
    setTimeout(() => this.moveToNextPlayer(), 2000);
  }

  moveToNextPlayer() {
    if (this.state.currentPlayerIndex < this.state.players.length - 1) {
      this.state.currentPlayerIndex += 1;
      this.state.currentPlayer = this.state.players[this.state.currentPlayerIndex];
      this.state.currentBid = this.state.currentPlayer.basePrice;
      this.state.currentBidder = null;
      this.state.bidHistory = [];
      this.state.status = 'active';
      this.state.timer = this.bidTimeoutSeconds;
      this.onStateChange(this.state);
      this.startTimer();
    } else {
      this.state.status = 'completed';
      this.onStateChange(this.state);
    }
  }

  getState() {
    return { ...this.state };
  }

  handleError(error: string) {
    this.state.error = error;
    this.onStateChange(this.state);
  }

  stopAuction() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state.status = 'ended';
    this.onStateChange(this.state);
  }
}

// Real-time sync helpers
const BACKEND_URL = process.env.NEXT_PUBLIC_AUCTION_BACKEND_URL || "http://localhost:4000";
let socket: Socket | null = null;

export function connectAuctionSocket(onStateUpdate: (state: AuctionState) => void) {
  if (!socket) {
    console.log("Connecting to auction socket at", BACKEND_URL);
    socket = socketIOClient(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket?.id);
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    socket.on("auctionStateUpdate", (state: AuctionState) => {
      console.log("Received auction state update:", state);
      onStateUpdate(state);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }
  
  return socket;
}

export async function pushAuctionStateToBackend(state: AuctionState) {
  try {
    await axios.post(`${BACKEND_URL}/api/auction/state`, state);
  } catch (err) {
    // Optionally handle error
    // console.error("Failed to push auction state to backend", err);
  }
}