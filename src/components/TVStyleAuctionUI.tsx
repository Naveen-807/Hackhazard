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
  userTeam: {
    name?: string;
    logoUrl?: string;
    owner?: string;
    budget?: number;
    spent?: number;
    players?: {
      name: string;
      role: string;
      price?: number;
      image?: string;
    }[];
  }; // User's default team
  isPaid?: boolean;
  isAuctionFinalized?: boolean;
  onPayFinalizedAmount?: () => Promise<{ success: boolean; error?: string }>;
  isProcessingPayment?: boolean;
  isCurrentUserWinner?: boolean;
  ownedNFTs?: string[];
  playerQueue?: any[];
  currentPlayerIndex?: number;
  onPlaceUserBid?: (amount: string) => void;
  userBidInput?: string;
  setUserBidInput?: (value: string) => void;
}

// Enhanced Status Badge component
const StatusBadge: React.FC<{
  status: string;
  isPaid?: boolean;
}> = ({ status, isPaid }) => {
  if (status === "Sold") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Badge className={`px-3 py-1 text-sm ${
          isPaid 
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white neon-green' 
            : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
        }`}>
          {isPaid ? "SOLD & PAID" : "SOLD (PAYMENT PENDING)"}
        </Badge>
      </motion.div>
    );
  }
  
  if (status === "Unsold") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <Badge className="px-3 py-1 text-sm bg-gradient-to-r from-red-600 to-pink-600 text-white">
          UNSOLD
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ 
        scale: status === "Active" ? [1, 1.05, 1] : 1
      }}
      transition={{ 
        repeat: status === "Active" ? Infinity : 0, 
        duration: 2
      }}
    >
      <Badge className={`px-3 py-1 text-sm ${
        status === "Active" 
          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
          : status === "Upcoming"
          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
      }`}>
        {status}
      </Badge>
    </motion.div>
  );
};

// Player Card with Glass Morphism and animation effects
const EnhancedPlayerCard: React.FC<{player: any}> = ({ player }) => {
  // Always call hooks in the same order, regardless of conditions
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const getOptimizedPlayerImage = (imageUrl: string | undefined) => {
    if (!imageUrl) return 'https://ui-avatars.com/api/?name=Unknown+Player&background=152238&color=fff&size=512';
    
    // Fix assets.iplt20.com URLs by using local public assets instead
    if (imageUrl.includes('assets.iplt20.com')) {
      const fileName = imageUrl.split('/').pop(); // Get the file name from URL
      return `/assets/players/${fileName}`; // Use local assets folder
    }
    
    return imageUrl;
  };

  // Set imageLoaded to true by default if there's no image
  useEffect(() => {
    if (!player?.imageUrl) {
      setImageLoaded(true);
    }
  }, [player?.imageUrl]);

  return (
    <motion.div 
      className="upcoming-player-card glass-panel hover-scale spotlight"
      whileHover={{ 
        y: -5,
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2), 0 0 15px rgba(59, 130, 246, 0.3)"
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-32 overflow-hidden rounded-t-lg">
        {!imageError ? (
          <img 
            src={getOptimizedPlayerImage(player.imageUrl)} 
            alt={player.name} 
            className={`w-full h-full object-contain bg-gradient-to-b from-[#0f172a] to-[#1e293b] ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            onLoad={() => setImageLoaded(true)}
            style={{ transition: 'opacity 0.3s ease-in-out' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            <User className="h-12 w-12 text-indigo-600/40" />
          </div>
        )}
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            <div className="player-image-skeleton" />
          </div>
        )}
        
        {/* Role Badge */}
        {player.role && (
          <div className="absolute top-2 right-2">
            <Badge className={`text-xs px-2 py-0.5 ${
              player.role.toLowerCase().includes('bat') ? 'bg-blue-600/90' :
              player.role.toLowerCase().includes('bowl') ? 'bg-red-600/90' :
              'bg-purple-600/90'
            } backdrop-blur-sm`}>
              {player.role}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-3 backdrop-blur-sm bg-[#151530]/80">
        <h4 className="font-medium text-white truncate">{player.name}</h4>
        {player.nationality && (
          <p className="text-xs text-indigo-400">{player.nationality}</p>
        )}
        {player.basePrice && (
          <div className="mt-1 flex justify-between items-center">
            <span className="text-xs text-indigo-400">Base Price:</span>
            <span className="text-sm font-medium text-amber-300">${player.basePrice}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// StatCard component with hover effects
const StatCard: React.FC<{label: string, value: string | number}> = ({ label, value }) => (
  <motion.div 
    className="stat-card neon-blue glass-panel rounded-lg p-3"
    whileHover={{ y: -2, scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <span className="text-xs text-indigo-400">{label}</span>
    <p className="text-xl font-bold text-white">{value}</p>
  </motion.div>
);

// BidHistoryItem component with animation
const BidHistoryItem: React.FC<{
  bid: any,
  isCurrentUser: boolean,
  isAIBot: boolean,
  currencySymbol: string,
  formatWalletAddress: (address: string | null | undefined) => string,
  isPaid?: boolean
}> = ({ bid, isCurrentUser, isAIBot, currencySymbol, formatWalletAddress, isPaid }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bid-history-item mb-2 p-3 rounded-lg ${
      isCurrentUser 
        ? 'bg-gradient-to-r from-indigo-900/30 to-blue-900/20 border border-indigo-600/40 neon-blue' 
        : isAIBot
          ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-700/30 neon-purple'
          : 'glass-panel border border-indigo-900/20'
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
          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
            isPaid && bid.status === 'SOLD' ? 'bg-emerald-600 text-white' : 
            bid.status === 'SOLD' ? 'bg-amber-600 text-white' : 
            bid.status === 'UNSOLD' ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
          }`}>
            {isPaid && bid.status === 'SOLD' ? 'PAID' : bid.status}
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
  </motion.div>
);

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
  const [moderatorSpeech, setModeratorSpeech] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
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

  // Text-to-speech for moderator
  const speakModeratorText = (text: string) => {
    if (!isTTSEnabled || !text) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Use browser's TTS
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for a more authoritative auctioneer voice
      utterance.rate = 1.0;  // Speed of speech
      utterance.pitch = 1.1; // Slightly higher pitch
      utterance.volume = 1.0; // Full volume
      
      // Try to find a male voice for the auctioneer
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes("Male") || 
        voice.name.includes("David") || 
        voice.name.includes("Mark") ||
        voice.name.includes("James")
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Generate speech based on auction state changes
  useEffect(() => {
    if (!playerInfo || !isTTSEnabled) return;
    
    let speechText = '';
    
    if (auctionStatus === "Active" && playerInfo?.name) {
      // New player announcement
      if (!moderatorSpeech.includes(playerInfo.name)) {
        speechText = `Now auctioning ${playerInfo.name}, ${playerInfo.role || 'Player'} with a base price of ${currencySymbol}${playerInfo.basePrice || '0'}.`;
      }
    } else if (auctionStatus === "Sold") {
      // Player sold announcement
      const winner = bidderName || formatWalletAddress(currentBidder);
      speechText = `${playerInfo.name} sold to ${winner} for ${currencySymbol}${currentBid.toFixed(2)}!`;
      
      // Add additional commentary based on AI recommendation if available
      if (aiRecommendation) {
        const bidValue = aiRecommendation.shouldBid ? "good value" : "high price";
        speechText += ` That's a ${bidValue} for this player.`;
      }
    }
    
    if (speechText && speechText !== moderatorSpeech) {
      setModeratorSpeech(speechText);
      speakModeratorText(speechText);
    }
  }, [playerInfo?.name, auctionStatus, isTTSEnabled, bidderName, currentBid, aiRecommendation]);
  
  // Announce next bid when the highest bidder changes
  useEffect(() => {
    if (currentBidder && prevBidder !== currentBidder && auctionStatus === "Active" && isTTSEnabled) {
      // Get bidder name
      const bidderDisplayName = bidderName || formatWalletAddress(currentBidder);
      
      // Create speech for bid
      const bidSpeech = `${bidderDisplayName} bids ${currencySymbol}${currentBid.toFixed(2)}!`;
      
      // Play sound and speak with small delay to avoid overlap
      if (outbidSound.current && prevBidder) {
        outbidSound.current.play();
        setTimeout(() => {
          speakModeratorText(bidSpeech);
        }, 500);
      } else if (bidSound.current) {
        bidSound.current.play();
        setTimeout(() => {
          speakModeratorText(bidSpeech);
        }, 500);
      }
    }
    
    // Update previous bidder
    setPrevBidder(currentBidder);
  }, [currentBidder, bidderName, currentBid, auctionStatus, isTTSEnabled]);
  
  // Announce time remaining when it's low
  useEffect(() => {
    if (isTTSEnabled && auctionStatus === "Active" && countdownTimer === 10) {
      speakModeratorText("10 seconds remaining!");
    } else if (isTTSEnabled && auctionStatus === "Active" && countdownTimer === 5) {
      speakModeratorText("5 seconds left to bid!");
    } else if (isTTSEnabled && auctionStatus === "Active" && countdownTimer === 3) {
      speakModeratorText("Going once...");
    } else if (isTTSEnabled && auctionStatus === "Active" && countdownTimer === 2) {
      speakModeratorText("Going twice...");
    } else if (isTTSEnabled && auctionStatus === "Active" && countdownTimer === 1) {
      speakModeratorText("Final call!");
    }
  }, [countdownTimer, auctionStatus, isTTSEnabled]);

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
        
        // FIXED: Use confetti without explicit worker options to avoid type errors
        const frame = () => {
          try {
            // Use simpler confetti options without useWorker
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 70,
              origin: { x: 0 },
              colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
            });
            
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 70,
              origin: { x: 1 },
              colors: ['#ff9900', '#ff00ff', '#00ffff', '#00ff99', '#9900ff']
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

  // Show payment modal when someone wins and it's finalized
  useEffect(() => {
    if (isAuctionFinalized && isCurrentUserWinner && !isPaid) {
      setShowPaymentModal(true);
      
      // Play winning sound when user wins
      if (isTTSEnabled && winSound.current) {
        winSound.current.play();
      }
      
      // Show confetti for user win
      setShowConfetti(true);
      const duration = 3 * 1000;
      const end = Date.now() + duration;
      
      const frame = () => {
        try {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 70,
            origin: { x: 0 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
          });
          
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 70,
            origin: { x: 1 },
            colors: ['#ff9900', '#ff00ff', '#00ffff', '#00ff99', '#9900ff']
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
  }, [isAuctionFinalized, isCurrentUserWinner, isPaid, isTTSEnabled]);

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

  return (
    <div className="auction-platform w-full bg-[#0a0a16] text-white">
      {/* Payment Modal for winners - Enhanced for MetaMask transactions */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 max-w-md w-full border border-green-500/40"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-green-800/30 flex items-center justify-center mx-auto mb-4">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                    className="w-14 h-14" 
                    alt="MetaMask" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Complete Purchase</h2>
                <p className="text-emerald-400">Send MONAD directly to the auction moderator</p>
              </div>
              
              <p className="text-lg text-emerald-400 mb-4">You won the bid for {playerInfo?.name}!</p>
              
              <div className="bg-slate-900/70 p-4 rounded-lg mb-6 w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Winning bid:</span>
                  <span className="text-white font-bold">{currencySymbol}{currentBid.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Your balance:</span>
                  <span className="text-emerald-400 font-bold">{currencySymbol}{userWalletBalance.toFixed(4)}</span>
                </div>
              </div>
              
              <div className="bg-slate-900/70 border border-yellow-500/20 p-4 rounded-lg mb-6 w-full">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-yellow-500 font-medium mb-1">Important</p>
                    <p className="text-xs text-slate-300">
                      By proceeding, your MetaMask wallet will open to confirm this transaction. The transaction sends {currencySymbol}{currentBid.toFixed(4)} directly to the auction moderator.
                    </p>
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={async () => {
                  if (onPayFinalizedAmount) {
                    setPaymentError(null); // clear any previous error
                    try {
                      const result = await onPayFinalizedAmount();
                      if (result && result.success) {
                        setShowPaymentModal(false);
                      } else if (result && result.error) {
                        setPaymentError(result.error);
                      }
                    } catch (err) {
                      setPaymentError((err as any)?.message || 'Payment failed. Please try again.');
                    }
                  }
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                disabled={isProcessingPayment}
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                      className="w-6 h-6" 
                      alt="MetaMask" />
                    Pay Now with MetaMask
                  </>
                )}
              </motion.button>
              
              {paymentError && (
                <div className="mt-2 text-red-400 text-sm">{paymentError}</div>
              )}
              
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="mt-3 text-sm text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
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
                          src={playerInfo.imageUrl && typeof playerInfo.imageUrl === 'string' 
                            ? (playerInfo.imageUrl.includes('assets.iplt20.com')
                              ? `/assets/players/${playerInfo.imageUrl.split('/').pop()}`
                              : playerInfo.imageUrl)
                            : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(playerInfo.name || 'Player') + '&background=152238&color=fff&size=512'
                          } 
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
                        <StatCard label="Batting Avg" value={playerInfo.stats.battingAverage} />
                      )}
                      
                      {playerInfo.stats.bowlingAverage && (
                        <StatCard label="Bowling Avg" value={playerInfo.stats.bowlingAverage} />
                      )}
                      
                      {playerInfo.stats.strikeRate && (
                        <StatCard label="Strike Rate" value={playerInfo.stats.strikeRate} />
                      )}
                      
                      {(playerInfo.stats.economyRate || playerInfo.stats.economy) && (
                        <StatCard label="Economy" value={playerInfo.stats.economyRate || playerInfo.stats.economy} />
                      )}
                      
                      {(playerInfo.stats.matchesPlayed || playerInfo.stats.matches) && (
                        <StatCard label="Matches" value={playerInfo.stats.matchesPlayed || playerInfo.stats.matches} />
                      )}
                      
                      {playerInfo.age && (
                        <StatCard label="Age" value={`${playerInfo.age} yrs`} />
                      )}
                      
                      {playerInfo.stats.totalRuns && (
                        <StatCard label="Total Runs" value={playerInfo.stats.totalRuns} />
                      )}
                      
                      {(playerInfo.stats.totalWickets || playerInfo.stats.wickets) && (
                        <StatCard label="Total Wickets" value={playerInfo.stats.totalWickets || playerInfo.stats.wickets} />
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
                        <div className="flex items-center gap-1.5">
                          {isWinnerAIBot && !isPaid && auctionStatus === "Sold" && (
                            <div className="flex items-center gap-1">
                              <span className="relative flex h-2.5 w-2.5 mr-0.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                              </span>
                              <span className="text-xs text-yellow-400">Payment pending</span>
                            </div>
                          )}
                          {isWinnerAIBot && isPaid && auctionStatus === "Sold" && (
                            <div className="flex items-center gap-1">
                              <span className="relative flex h-2.5 w-2.5 mr-0.5">
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-xs text-emerald-400">Payment complete</span>
                            </div>
                          )}
                          <span className="font-medium text-white">
                            {bidderName || formatWalletAddress(currentBidder)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Active Bidders */}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-indigo-300">Active Bidders</span>
                      <span className="font-medium text-white">{activeBidders}</span>
                    </div>
                  </div>
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
                  <EnhancedPlayerCard key={player.id || index} player={player} />
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
                          <BidHistoryItem 
                            key={index}
                            bid={bid}
                            isCurrentUser={isCurrentUser}
                            isAIBot={isAIBot}
                            currencySymbol={currencySymbol}
                            formatWalletAddress={formatWalletAddress}
                            isPaid={isPaid}
                          />
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
      
      {/* Only render payment button in the main UI if modal is not shown */}
      {isCurrentUserWinner && isAuctionFinalized && !isPaid && !showPaymentModal && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
          <motion.button
            onClick={() => setShowPaymentModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="py-3 px-6 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-green-900/30"
          >
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAADL0lEQVR4nO2VW0iTYRjH/5/7ZmqmxYIggkLooiDpIogisoukbdJpbi7n2K6SEUWlmUpWZkFkddPFuosdmHY4KapZnpZuzszj5jzt2DGnbnP7tvdDmey0C/F68X/1vs/z/J7/8zwvwX/+NFZ2N+k3VXZ11RXUbWHv4bCj44P7L6p7i0m4kaNBneO4zhKyGrtxNmzm9GhjQoJG8TdiXXuT8ZDew/kbObqy/mpiRke35cS2HHboyaKjpdOcbpDscQ/nMzX6mn7LAPk4/GK83bkMwKLwCBLMr+kLXDYRs4UPUNnVvMfY66cb+1vJdNi3eSJGRSjOOGycLkhZjIEo1bavayrqbpldOW2QeBBKEwb1sc9mEAB94cUdc2j09Qw2SMzm88Ud6VaWZbPYKMLDsg4Fm866vQNoqG31d7BEeTBBQEmdvrlHs47I+RmhaOvx1LyJjZ+c9fW7KLjwQWuGbWvj8X6wwfWIhLZOQXlqprWnm97Fma65OGJ5NLY8dY7LYRKaOoT39p6z00DJ9ZN7rB1Gh9OTdy3bdbCyYZqdAVcsp3ceNrRO0lfvpNnN5eUMAtDaeq7M1tkebRXsFPX1ZV1KG3OLLWO2epLZN0TZ/lHqxmQk1RKnXSyu7MwefNcSUd/iipgYcQX6pJNicfn16m4+Pdf2dWi+N3NwsBzp6cVrqg3FIVFVGkvvsyhzX1HYFecZ25s6ZuuYTORMj9eWhr9OyrlTYJ9uz1R3fe0HwJg7RkYk+JclAIwoU5GrDyM9vB0AtYod0ZaiVNkzvOxOLPCPpWxuXrYJ73E1YntLaFZ23l7glaWQ1IRA5A39QqCiSv0GS0Ss9oC0le8IKggdGDTzejyiQUllDS4HDypqrEmScNxTJDbn4JCiuEMRDiB8rPgWJLE1SXU3a/taoPNU43KhCveSNfidqUHnhQrMPFbiT3SPW95b0AeVe26oJYnm3Ff7oRhdfDaXpTmir6xMMej0xUQs+vR0bNjp9c3C/jqIXlM0o283AqDEffG55YLG2QU0HK58U9Sgh8jJaz5gK+zCVPHxZygTsiGThtWvqclDw2V3Fd/wLU77LCCW09MUAldPH4bXlIYNefEIVkbyFi6/2f8x/gJCgiuBo5lLJQAAAABJRU5ErkJggg==" 
              className="w-6 h-6" 
              alt="MetaMask" />
            Complete Payment
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default TVStyleAuctionUI;
