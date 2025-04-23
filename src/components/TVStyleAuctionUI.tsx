import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Volume2, VolumeX, Check, RotateCw, 
  AlertCircle, Trophy, BellRing, User, Wallet
} from "lucide-react";
import { Howl } from "howler";
import confetti from 'canvas-confetti';
import { isAIBotAddress } from "@/lib/auction-contract";

// Import CSS
import "./TVStyleAuction.css"; 

// Types for props
interface TVStyleAuctionUIProps {
  playerInfo: any;
  upcomingPlayers: any[];
  currentBid: number;
  currentBidder: string;
  bidderName?: string;
  bidHistory: { 
    bidder: string; 
    amount: number; 
    bidderName?: string; 
    timestamp?: number;
    botName?: string;
    teamLogo?: string;
    status?: string;
  }[];
  auctionStatus: string;
  moderatorMessage: string;
  countdownTimer: number;
  activeBidders: number;
  onPlaceBid: (amount: number) => void;
  onToggleTTS: () => void;
  isTTSEnabled: boolean;
  userWalletBalance: number;
  currencySymbol: string;
  onAutoBidToggle: (enabled: boolean) => void;
  onAutoBidAmountChange: (amount: number) => void;
  isAutoBidEnabled: boolean;
  autoBidAmount: number;
  maxAutoBidAmount: number;
  onConnectWallet: () => void;
  isWalletConnected: boolean;
  aiRecommendation?: {
    shouldBid: boolean;
    recommendedBidAmount?: number;
    reasoning?: string;
    reason?: string;
    playerValueAssessment?: string;
    strategicAdvice?: string;
    confidence?: number;
  };
  isLoadingRecommendation?: boolean;
  walletAddress?: string | null;
  userTeam: any; // User's default team
  isPaid?: boolean;
  isAuctionFinalized?: boolean;
  onPayFinalizedAmount?: () => Promise<void>;
  isProcessingPayment?: boolean;
  isCurrentUserWinner?: boolean;
  ownedNFTs?: string[];
  playerQueue?: any[];
  currentPlayerIndex?: number;
  onPlaceUserBid?: (amount: string) => void;
  userBidInput?: string;
  setUserBidInput?: (value: string) => void;
}

// Status badge component
const StatusBadge: React.FC<{
  status: string;
  isPaid?: boolean;
}> = ({ status, isPaid }) => {
  if (status === "Sold") {
    return (
      <Badge className={`px-3 py-1 text-sm ${
        isPaid 
          ? "bg-green-600 text-white" 
          : "bg-amber-600 text-white"
      }`}>
        {isPaid ? "SOLD & PAID" : "SOLD (PAYMENT PENDING)"}
      </Badge>
    );
  }

  return (
    <Badge className={`px-3 py-1 text-sm ${
      status === "Active" 
        ? "bg-green-600 text-white" 
        : status === "Upcoming"
        ? "bg-purple-600 text-white"
        : "bg-blue-600 text-white"
    }`}>
      {status}
    </Badge>
  );
};

// Payment status component
const PaymentStatus: React.FC<{
  isCurrentUserWinner: boolean;
  isPaid: boolean;
  currentBid: number;
  currencySymbol: string;
  isAIWinner: boolean;
  isProcessingPayment: boolean;
  onPayFinalizedAmount?: () => Promise<void>;
}> = ({ 
  isCurrentUserWinner, 
  isPaid, 
  currentBid, 
  currencySymbol, 
  isAIWinner,
  isProcessingPayment,
  onPayFinalizedAmount
}) => {
  if (!isCurrentUserWinner && !isAIWinner) return null;
  
  if (isPaid) {
    return (
      <Card className="payment-complete bg-green-900/20 border-green-500/30 p-4 mt-3">
        <div className="flex items-center text-green-400 mb-2">
          <Check className="h-5 w-5 mr-1.5" />
          <span className="font-semibold">Payment Complete</span>
        </div>
        <p className="text-sm text-green-100">
          {isAIWinner 
            ? 'AI bot payment was processed automatically.' 
            : `Your payment of ${currencySymbol}${currentBid.toFixed(2)} was successful.`}
        </p>
        <div className="mt-2 text-xs text-blue-300 flex items-center">
          <Trophy className="h-4 w-4 mr-1 text-yellow-400" />
          <span>Player NFT will be minted and transferred to your wallet</span>
        </div>
      </Card>
    );
  }
  
  if (isAIWinner) {
    return (
      <Card className="payment-processing bg-blue-900/20 border-blue-500/30 p-4 mt-3">
        <div className="flex items-center text-blue-400 mb-2">
          <RotateCw className="h-5 w-5 mr-1.5 animate-spin" />
          <span className="font-semibold">AI Payment Processing</span>
        </div>
        <p className="text-sm text-blue-100">
          The AI bot is automatically processing the payment for this player.
        </p>
      </Card>
    );
  }
  
  if (isCurrentUserWinner && onPayFinalizedAmount) {
    return (
      <Card className="payment-required bg-amber-900/20 border-amber-500/30 p-4 mt-3">
        <div className="flex items-center text-amber-400 mb-2">
          <BellRing className="h-5 w-5 mr-1.5" />
          <span className="font-semibold">Payment Required</span>
        </div>
        <p className="text-sm text-amber-100 mb-3">
          You won the auction! Please pay {currencySymbol}{currentBid.toFixed(2)} to complete your purchase.
        </p>
        <Button 
          onClick={onPayFinalizedAmount}
          disabled={isProcessingPayment}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        >
          {isProcessingPayment ? (
            <><RotateCw className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
          ) : (
            <>Pay {currencySymbol}{currentBid.toFixed(2)} Now</>
          )}
        </Button>
      </Card>
    );
  }
  
  return null;
};

// Main component
const TVStyleAuctionUI: React.FC<TVStyleAuctionUIProps> = ({
  playerInfo,
  upcomingPlayers,
  currentBid,
  currentBidder,
  bidderName,
  bidHistory,
  auctionStatus,
  moderatorMessage,
  countdownTimer,
  activeBidders,
  onPlaceBid,
  onToggleTTS,
  isTTSEnabled,
  userWalletBalance,
  currencySymbol,
  onAutoBidToggle,
  onAutoBidAmountChange,
  isAutoBidEnabled,
  autoBidAmount,
  maxAutoBidAmount,
  onConnectWallet,
  isWalletConnected,
  aiRecommendation,
  walletAddress,
  userTeam,
  isPaid = false,
  isAuctionFinalized = false,
  onPayFinalizedAmount,
  isProcessingPayment = false,
  isCurrentUserWinner = false,
  ownedNFTs = [],
  onPlaceUserBid,
  userBidInput = "",
  setUserBidInput
}) => {
  // Local state
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [prevBidder, setPrevBidder] = useState<string | null>(null);
  
  // Sound instances
  const bidSound = React.useRef<Howl | null>(null);
  const outbidSound = React.useRef<Howl | null>(null);
  const winSound = React.useRef<Howl | null>(null);
  
  // Check if winner is an AI bot
  const isWinnerAIBot = React.useMemo(() => {
    if (!currentBidder) return false;
    return isAIBotAddress(currentBidder);
  }, [currentBidder]);

  // Initialize sounds
  useEffect(() => {
    bidSound.current = new Howl({
      src: ['/sounds/bid.mp3'],
      volume: 0.5
    });
    
    outbidSound.current = new Howl({
      src: ['/sounds/outbid.mp3'],
      volume: 0.7
    });
    
    winSound.current = new Howl({
      src: ['/sounds/win.mp3'],
      volume: 0.8
    });
    
    return () => {
      // Clean up sounds
      bidSound.current?.unload();
      outbidSound.current?.unload();
      winSound.current?.unload();
    };
  }, []);

  // Track bidder changes for outbid notifications
  useEffect(() => {
    if (currentBidder && prevBidder && currentBidder !== prevBidder) {
      if (isTTSEnabled && outbidSound.current) {
        outbidSound.current.play();
      }
      
      // Visual feedback if user is outbid
      if (prevBidder === walletAddress) {
        document.body.classList.add('outbid-flash');
        setTimeout(() => {
          document.body.classList.remove('outbid-flash');
        }, 1000);
      }
    }
    
    setPrevBidder(currentBidder);
  }, [currentBidder, prevBidder, walletAddress, isTTSEnabled]);

  // Handle auction end and celebrations
  useEffect(() => {
    if (auctionStatus === "Sold" && !showConfetti) {
      // Play win sound
      if (isTTSEnabled && winSound.current) {
        winSound.current.play();
      }
      
      if (isCurrentUserWinner) {
        // Show confetti for user win
        setShowConfetti(true);
        const duration = 3 * 1000;
        const end = Date.now() + duration;
        
        // FIXED: Use confetti without web workers to avoid CSP issues
        const frame = () => {
          try {
            // Use the non-worker based approach by passing {useWorker: false}
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 70,
              origin: { x: 0 },
              colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
              useWorker: false // Explicitly disable web workers
            });
            
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 70,
              origin: { x: 1 },
              colors: ['#ff9900', '#ff00ff', '#00ffff', '#00ff99', '#9900ff'],
              useWorker: false // Explicitly disable web workers
            });
            
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            } else {
              setShowConfetti(false);
            }
          } catch (error) {
            console.error("Error with confetti animation:", error);
            setShowConfetti(false);
          }
        };
        
        frame();
      }
    }
  }, [auctionStatus, isTTSEnabled, showConfetti, isCurrentUserWinner]);

  // Format wallet address for display
  const formatWalletAddress = (address: string | null | undefined) => {
    if (!address) return "-";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get next bid suggestions
  const getNextBidSuggestions = () => {
    const increment = Math.max(0.05, currentBid * 0.05);
    const suggestions = [
      Math.round((currentBid + increment) * 100) / 100,
      Math.round((currentBid + increment * 2) * 100) / 100,
      Math.round((currentBid + increment * 3) * 100) / 100
    ];
    return suggestions;
  };

  // Handle bid submission
  const handleBid = () => {
    if (!userBidInput || !onPlaceUserBid) return;
    
    // Place bid
    onPlaceUserBid(userBidInput);
    
    // Play bid sound
    if (isTTSEnabled && bidSound.current) {
      bidSound.current.play();
    }
  };
  
  // Bid suggestions
  const bidSuggestions = getNextBidSuggestions();

  // Fix player image URL if needed
  const getOptimizedPlayerImage = (imageUrl: string | undefined) => {
    if (!imageUrl) return 'https://ui-avatars.com/api/?name=Unknown+Player&background=152238&color=fff&size=512';
    
    // Fix assets.iplt20.com URLs by using local public assets instead
    if (imageUrl.includes('assets.iplt20.com')) {
      const fileName = imageUrl.split('/').pop(); // Get the file name from URL
      return `/assets/players/${fileName}`; // Use local assets folder
    }
    
    return imageUrl;
  };

  return (
    <div className="auction-platform w-full bg-[#0a0a16] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090918]/90 backdrop-blur-md border-b border-indigo-900/40 shadow-md shadow-indigo-900/10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              IPL Player Auction
            </div>
            <div className="live-indicator flex items-center ml-2">
              <span className="live-dot"></span>
              <span className="ml-1 text-xs">LIVE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Team */}
            {userTeam && (
              <div className="hidden md:flex items-center gap-2 bg-[#1a103a] px-3 py-1.5 rounded-lg border border-indigo-800/40">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0d0d1f] flex-shrink-0">
                  {userTeam.logoUrl && (
                    <img 
                      src={userTeam.logoUrl} 
                      alt={userTeam.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="text-sm font-medium text-indigo-300">{userTeam.name}</span>
              </div>
            )}
            
            {/* Wallet Balance */}
            {isWalletConnected && (
              <div className="hidden md:flex items-center gap-2 bg-[#0d261f] px-3 py-1.5 rounded-lg border border-emerald-800/30">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  {currencySymbol}{userWalletBalance.toFixed(2)}
                </span>
              </div>
            )}
            
            {/* Wallet Address or Connect Button */}
            {isWalletConnected ? (
              <div className="flex items-center gap-2 bg-[#111133] px-3 py-1.5 rounded-lg border border-indigo-800/40">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-indigo-300">
                  {formatWalletAddress(walletAddress)}
                </span>
              </div>
            ) : (
              <Button 
                size="sm"
                onClick={onConnectWallet}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Connect Wallet
              </Button>
            )}
            
            {/* Sound Toggle */}
            <button
              onClick={onToggleTTS}
              className="p-1.5 rounded-md bg-[#151530] border border-indigo-800/40"
            >
              {isTTSEnabled ? (
                <Volume2 className="h-4 w-4 text-indigo-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Column - Player Showcase */}
        <section className="w-full lg:w-3/5 space-y-6">
          {/* Main Player Card */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={playerInfo?.id || 'player-card'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="player-showcase bg-[#12122a] rounded-xl overflow-hidden border border-indigo-900/30 shadow-xl"
            >
              {/* Player Header with Status */}
              <div className="p-4 flex justify-between items-center border-b border-[#1e1e45] bg-gradient-to-r from-[#0f0f28] to-[#121230]">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold text-white">
                    {playerInfo?.name || 'Loading Player...'}
                  </h2>
                  {playerInfo?.nationality && (
                    <span className="text-sm text-indigo-400">({playerInfo.nationality})</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <StatusBadge status={auctionStatus} isPaid={isPaid} />
                  
                  {/* Countdown Timer */}
                  {auctionStatus === "Active" && (
                    <div className={`countdown py-1 px-3 rounded-lg border ${
                      countdownTimer <= 10
                        ? 'text-red-400 border-red-500/30 bg-red-900/30'
                        : 'text-blue-300 border-blue-500/30 bg-blue-900/20'
                    }`}>
                      <motion.span
                        animate={{ 
                          scale: countdownTimer <= 5 ? [1, 1.1, 1] : 1,
                          color: countdownTimer <= 5 ? ["#f87171", "#ef4444", "#f87171"] : undefined
                        }}
                        transition={{ duration: 0.5, repeat: countdownTimer <= 5 ? Infinity : 0 }}
                        className="text-base md:text-lg font-bold"
                      >
                        {countdownTimer}s
                      </motion.span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Player Content */}
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Player Image */}
                <div className="md:w-2/5 flex flex-col">
                  {/* Player Image with Frame */}
                  <div className="relative aspect-[3/4] w-full max-w-xs mx-auto md:mx-0 mb-4">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-indigo-600/20 backdrop-blur-sm"></div>
                    <div className="absolute inset-2 rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                      {playerInfo?.imageUrl ? (
                        <img 
                          src={getOptimizedPlayerImage(playerInfo.imageUrl)} 
                          alt={playerInfo.name || 'Player'} 
                          className="w-full h-full object-contain bg-gradient-to-b from-slate-900 to-black"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + 
                              encodeURIComponent(playerInfo.name || 'Player') + '&background=152238&color=fff&size=512';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#151535] to-[#1e1e3e]">
                          <User className="h-20 w-20 text-indigo-600/40" />
                        </div>
                      )}
                    </div>
                    
                    {/* Role Badge */}
                    {playerInfo?.role && (
                      <div className="absolute top-4 right-4">
                        <Badge className={`px-3 py-1 font-semibold ${
                          playerInfo.role.toLowerCase().includes('bat') ? 'bg-blue-600 text-white' :
                          playerInfo.role.toLowerCase().includes('bowl') ? 'bg-red-600 text-white' :
                          'bg-purple-600 text-white'
                        }`}>
                          {playerInfo.role}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Base Price */}
                    {playerInfo?.basePrice && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                          <span className="text-xs text-gray-400">Base Price</span>
                          <p className="text-lg font-bold text-white">{currencySymbol}{playerInfo.basePrice}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Player Details */}
                <div className="md:w-3/5">
                  {/* Player Stats */}
                  {playerInfo && playerInfo.stats && (
                    <div className="stats-grid grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                      {playerInfo.stats.battingAverage && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Batting Avg</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.battingAverage}</p>
                        </div>
                      )}
                      
                      {playerInfo.stats.bowlingAverage && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Bowling Avg</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.bowlingAverage}</p>
                        </div>
                      )}
                      
                      {playerInfo.stats.strikeRate && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Strike Rate</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.strikeRate}</p>
                        </div>
                      )}
                      
                      {(playerInfo.stats.economyRate || playerInfo.stats.economy) && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Economy</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.economyRate || playerInfo.stats.economy}</p>
                        </div>
                      )}
                      
                      {(playerInfo.stats.matchesPlayed || playerInfo.stats.matches) && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Matches</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.matchesPlayed || playerInfo.stats.matches}</p>
                        </div>
                      )}
                      
                      {playerInfo.age && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Age</span>
                          <p className="text-xl font-bold text-white">{playerInfo.age} yrs</p>
                        </div>
                      )}
                      
                      {playerInfo.stats.totalRuns && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Total Runs</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.totalRuns}</p>
                        </div>
                      )}
                      
                      {(playerInfo.stats.totalWickets || playerInfo.stats.wickets) && (
                        <div className="stat-card bg-[#15153a] rounded-lg p-3 border border-indigo-900/30">
                          <span className="text-xs text-indigo-400">Total Wickets</span>
                          <p className="text-xl font-bold text-white">{playerInfo.stats.totalWickets || playerInfo.stats.wickets}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Current Bid Status */}
                  <div className="current-bid-status bg-[#1a1a40] rounded-lg p-4 border border-indigo-800/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-indigo-300">Current Bid</span>
                      <span className="text-lg font-bold text-white">{currencySymbol}{currentBid.toFixed(2)}</span>
                    </div>
                    
                    {/* Current Bidder */}
                    {currentBidder && (
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-300">Highest Bidder</span>
                        <span className="font-medium text-white">
                          {bidderName || 
                            (isAIBotAddress(currentBidder) ? "AI Bot" : formatWalletAddress(currentBidder))}
                        </span>
                      </div>
                    )}
                    
                    {/* Active Bidders */}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-indigo-300">Active Bidders</span>
                      <span className="font-medium text-white">{activeBidders}</span>
                    </div>
                  </div>
                  
                  {/* Payment Status (if applicable) */}
                  {isAuctionFinalized && (
                    <PaymentStatus
                      isCurrentUserWinner={isCurrentUserWinner}
                      isPaid={isPaid}
                      currentBid={currentBid}
                      currencySymbol={currencySymbol}
                      isAIWinner={isWinnerAIBot}
                      isProcessingPayment={isProcessingPayment}
                      onPayFinalizedAmount={onPayFinalizedAmount}
                    />
                  )}
                </div>
              </div>
              
              {/* Moderator Message */}
              {moderatorMessage && (
                <div className="moderator-message border-t border-indigo-900/30 bg-[#1c142d] p-4">
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Moderator Message</span>
                  </div>
                  <p className="text-amber-200">{moderatorMessage}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Bidding Controls - Only for active auctions */}
          {auctionStatus === "Active" && isWalletConnected && (
            <div className="bidding-controls bg-[#12122a] rounded-xl border border-indigo-900/30 shadow-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Place Your Bid</h3>
              
              <div className="manual-bidding mb-5">
                <div className="flex flex-col md:flex-row gap-3 mb-3">
                  <Input
                    type="number"
                    value={userBidInput}
                    onChange={(e) => setUserBidInput && setUserBidInput(e.target.value)}
                    placeholder={`Enter amount (${currencySymbol})`}
                    className="flex-1 bg-[#1a1a40] border-indigo-800/50 focus:border-indigo-500 text-white"
                    step={0.01}
                    min={currentBid + 0.01}
                  />
                  
                  <Button 
                    onClick={handleBid}
                    disabled={!userBidInput || parseFloat(userBidInput) <= currentBid}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium"
                  >
                    Place Bid
                  </Button>
                </div>
                
                {/* Bid Suggestions */}
                <div className="bid-suggestions flex gap-2">
                  {bidSuggestions.map((suggestion, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => setUserBidInput && setUserBidInput(suggestion.toString())}
                      className="flex-1 border-indigo-800/40 bg-[#1a1a40]/50 hover:bg-[#202050] text-indigo-200"
                    >
                      {currencySymbol}{suggestion.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Auto Bidding by AI */}
              <div className="auto-bidding bg-[#15153a]/60 rounded-lg p-4 border border-indigo-800/30">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className="font-medium text-indigo-200">AI Auto-Bidding</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isAutoBidEnabled}
                        onChange={(e) => onAutoBidToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#252560] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
                
                {isAutoBidEnabled && (
                  <>
                    <p className="text-xs text-indigo-300 mb-3">
                      Our AI will place optimal bids for you up to your maximum amount.
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-indigo-400 mb-1 block">Maximum Bid Amount</label>
                        <Input
                          type="number"
                          value={autoBidAmount}
                          onChange={(e) => onAutoBidAmountChange(parseFloat(e.target.value))}
                          placeholder="Maximum amount"
                          className="bg-[#1a1a40] border-indigo-800/50 focus:border-indigo-500 text-white"
                          step={0.1}
                          min={currentBid + 0.1}
                          max={maxAutoBidAmount}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-xs text-indigo-400 mb-1 block">Wallet Balance</label>
                        <div className="h-10 flex items-center px-3 rounded-md bg-[#1a1a40] border border-indigo-800/50 text-white">
                          {currencySymbol}{userWalletBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Recommendation */}
                    {aiRecommendation && (
                      <div className="mt-3 p-3 rounded bg-[#1c142d] border border-purple-900/30 text-xs">
                        <div className="flex items-center gap-1 text-purple-400 mb-1">
                          <span className="font-medium">AI Recommendation:</span>
                        </div>
                        <p className="text-purple-200">
                          {aiRecommendation.shouldBid 
                            ? `Recommended bid: ${currencySymbol}${aiRecommendation.recommendedBidAmount?.toFixed(2)}` 
                            : "AI suggests not bidding on this player."}
                        </p>
                        {aiRecommendation.reasoning && (
                          <p className="mt-1 text-purple-300/70">{aiRecommendation.reasoning}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Upcoming Players */}
          {upcomingPlayers && upcomingPlayers.length > 0 && (
            <div className="upcoming-players bg-[#12122a] rounded-xl border border-indigo-900/30 shadow-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Coming Up Next</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingPlayers.slice(0, 3).map((player, index) => (
                  <div 
                    key={player.id || index}
                    className="upcoming-player-card bg-[#15153a] rounded-lg overflow-hidden border border-indigo-800/30"
                  >
                    <div className="relative h-32">
                      {player.imageUrl ? (
                        <img 
                          src={getOptimizedPlayerImage(player.imageUrl)} 
                          alt={player.name} 
                          className="w-full h-full object-contain bg-gradient-to-b from-slate-900 to-black"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + 
                              encodeURIComponent(player.name || 'Player') + '&background=152238&color=fff&size=256';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a40]">
                          <User className="h-12 w-12 text-indigo-600/40" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h4 className="font-medium text-white truncate">{player.name}</h4>
                      {player.nationality && (
                        <p className="text-xs text-indigo-400">{player.nationality}</p>
                      )}
                      {player.basePrice && (
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-indigo-400">Base Price:</span>
                          <span className="text-sm font-medium text-white">{currencySymbol}{player.basePrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        
        {/* Right Column - Bidding History and Statistics */}
        <section className="w-full lg:w-2/5">
          <div className="sticky top-20">
            {/* Tabs for Bid History and Team Info */}
            <Tabs 
              defaultValue="bidHistory" 
              className="bg-[#12122a] rounded-xl border border-indigo-900/30 shadow-xl overflow-hidden"
            >
              <TabsList className="w-full bg-[#0d0d22] p-0 h-12">
                <TabsTrigger 
                  value="bidHistory"
                  className="flex-1 h-full data-[state=active]:bg-[#12122a] data-[state=active]:text-white"
                >
                  Bid History
                </TabsTrigger>
                <TabsTrigger 
                  value="teamInfo"
                  className="flex-1 h-full data-[state=active]:bg-[#12122a] data-[state=active]:text-white"
                >
                  Your Team
                </TabsTrigger>
              </TabsList>
              
              {/* Bid History Tab */}
              <TabsContent value="bidHistory" className="p-0 m-0">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-3">Live Bid History</h3>
                  
                  {bidHistory.length > 0 ? (
                    <div className="bid-history-list max-h-[500px] overflow-y-auto pr-2">
                      {bidHistory.map((bid, index) => {
                        const isCurrentUser = bid.bidder === walletAddress;
                        const isAIBot = isAIBotAddress(bid.bidder);
                        
                        return (
                          <div 
                            key={index}
                            className={`bid-history-item mb-2 p-3 rounded-lg border ${
                              isCurrentUser 
                                ? 'bg-indigo-900/30 border-indigo-600/40' 
                                : isAIBot
                                  ? 'bg-purple-900/20 border-purple-700/30'
                                  : 'bg-[#15153a] border-indigo-900/20'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {bid.teamLogo && (
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0d0d1f] flex-shrink-0">
                                    <img 
                                      src={bid.teamLogo} 
                                      alt={bid.botName || "Team"} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                {!bid.teamLogo && (
                                  <div className={`w-2 h-2 rounded-full ${
                                    isCurrentUser ? 'bg-blue-500' : 
                                    isAIBot ? 'bg-purple-500' : 'bg-gray-500'
                                  }`}></div>
                                )}
                                <span className="font-medium text-white">
                                  {isCurrentUser ? 'You' : 
                                    bid.botName || bid.bidderName || formatWalletAddress(bid.bidder)}
                                </span>
                              </div>
                              <div>
                                <span className="font-bold text-white">
                                  {currencySymbol}{bid.amount.toFixed(4)}
                                </span>
                                {bid.status && (
                                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                                    {bid.status}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Timestamp if available */}
                            {bid.timestamp && (
                              <div className="mt-1 text-xs text-indigo-400 text-right">
                                {new Date(bid.timestamp).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-indigo-400">
                      <p>No bids placed yet.</p>
                      <p className="text-sm mt-1">Be the first to bid on this player!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Team Info Tab */}
              <TabsContent value="teamInfo" className="p-0 m-0">
                <div className="p-5">
                  {userTeam ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1a1a40] flex items-center justify-center">
                          {userTeam.logoUrl ? (
                            <img 
                              src={userTeam.logoUrl} 
                              alt={userTeam.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-indigo-400">
                              {userTeam.name?.charAt(0) || "T"}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{userTeam.name}</h3>
                          {userTeam.owner && (
                            <p className="text-sm text-indigo-400">Owner: {userTeam.owner}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Team Budget */}
                      <div className="bg-[#15153a] rounded-lg p-3 mb-4 border border-indigo-900/30">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-300">Total Budget</span>
                          <span className="font-bold text-white">{currencySymbol}{userTeam.budget?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-indigo-300">Spent</span>
                          <span className="font-medium text-indigo-200">{currencySymbol}{userTeam.spent?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-indigo-300">Balance</span>
                          <span className="font-medium text-emerald-400">
                            {currencySymbol}{((userTeam.budget || 0) - (userTeam.spent || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Acquired Players */}
                      <h4 className="font-medium text-white mb-2">Acquired Players</h4>
                      {userTeam.players && userTeam.players.length > 0 ? (
                        <div className="acquired-players-list max-h-[300px] overflow-y-auto pr-2">
                          {userTeam.players.map((player, index) => (
                            <div 
                              key={index} 
                              className="acquired-player-item flex items-center gap-3 p-3 bg-[#15153a] rounded-lg mb-2 border border-indigo-900/20"
                            >
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-[#1a1a40] flex-shrink-0">
                                {player.image ? (
                                  <img 
                                    src={player.image} 
                                    alt={player.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 m-2 text-indigo-600/40" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-white truncate">{player.name}</h5>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-indigo-400">{player.role}</span>
                                  <span className="text-xs font-medium text-emerald-400">{currencySymbol}{player.price?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : ownedNFTs && ownedNFTs.length > 0 ? (
                        <div className="acquired-players-list max-h-[300px] overflow-y-auto pr-2">
                          {ownedNFTs.map((playerName, index) => (
                            <div 
                              key={index} 
                              className="acquired-player-item flex items-center gap-3 p-3 bg-[#15153a] rounded-lg mb-2 border border-indigo-900/20"
                            >
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-[#1a1a40] flex-shrink-0">
                                <div className="w-full h-full flex items-center justify-center">
                                  <Trophy className="w-6 h-6 text-amber-400" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-white truncate">{playerName}</h5>
                                <div className="flex items-center">
                                  <span className="text-xs text-emerald-400">NFT Owned</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-indigo-400">
                          <p>No players acquired yet.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 text-indigo-400">
                      <p>Team information not available.</p>
                      <p className="text-sm mt-1">Connect your wallet to view your team.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TVStyleAuctionUI;
