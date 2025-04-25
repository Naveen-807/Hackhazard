"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TrumpCardBattle from '../../components/TrumpCardBattle';
import WalletConnector from '../../components/WalletConnector';
import PlayerInfoCard from '../../components/PlayerInfoCard';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, ChevronsRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const MODERATOR_ADDRESS = "0xD76BFB9C5b8B2309e2134Fef7A9f5C926c4Dcf4A"; // Replace with real moderator address

// TODO: Replace with a client-compatible import or fetch for player data
const MOCK_PLAYERS = [
  {
    id: 'player1',
    name: 'Virat Kohli',
    team: 'Royal Challengers Bangalore',
    photo: '/assets/players/player1.png',
    rarity: 'Epic',
    stats: {
      Batting: 85,
      Bowling: 30,
      Fitness: 90,
      Popularity: 95,
    }
  },
];

for (let i = 2; i <= 50; i++) {
  MOCK_PLAYERS.push({
    id: `player${i}`,
    name: `Player ${i}`,
    team: ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Delhi Capitals'][Math.floor(Math.random() * 4)],
    photo: `/assets/players/player${i}.png`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)],
    stats: {
      Batting: Math.floor(Math.random() * 50) + 30,
      Bowling: Math.floor(Math.random() * 50) + 30,
      Fitness: Math.floor(Math.random() * 50) + 30,
      Popularity: Math.floor(Math.random() * 50) + 30,
    }
  });
}

function mapPlayerJsonToTrumpCard(playerJson: any, id: string): any {
  const getAttr = (trait: string) => {
    const attr = playerJson.attributes.find((a: any) => a.trait_type === trait);
    return attr ? attr.value : undefined;
  };
  return {
    id,
    name: playerJson.name,
    team: getAttr('Previous Team') || 'Unknown',
    photo: `/assets/players/${id}.png`,
    rarity: getAttr('Rarity') || 'Common',
    stats: {
      Batting: Number(getAttr('Batting Average')) || Math.floor(Math.random() * 50) + 20,
      Bowling: Number(getAttr('Bowling Average')) || Math.floor(Math.random() * 50) + 20,
      Fitness: Math.floor(Math.random() * 100),
      Popularity: Math.floor(Math.random() * 100),
    }
  };
}

function getRandomPlayers(count: number) {
  const shuffled = [...MOCK_PLAYERS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateFakeHash() {
  return '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}

const NUM_TEAMS = 5; // 1 user + 4 AI
const TEAM_SIZE = 7;
const ENTRY_FEE = 0.5; // 0.5 MOD entry fee

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-blue-500/20 animate-float"
          style={{
            width: `${Math.random() * 20 + 5}px`,
            height: `${Math.random() * 20 + 5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.1
          }}
        />
      ))}
    </div>
  );
};

// Lazy load Confetti to avoid SSR issues
const Confetti = dynamic(() => import('react-confetti'), { 
  ssr: false,
  loading: () => null
});

const QuickMatchPage: React.FC = () => {
  const bidSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const outbidSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Create refs for intervals and timeouts for proper cleanup
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const [started, setStarted] = useState(false);
  const [userTeam, setUserTeam] = useState<any[]>([]);
  const [aiTeams, setAiTeams] = useState<any[][]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ wins: number; losses: number; teamPerformance: Record<string, number> }>({
    wins: 0,
    losses: 0,
    teamPerformance: {}
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'waiting' | 'processing' | 'confirmed' | 'failed'>('waiting');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [aiTransactionStatus, setAiTransactionStatus] = useState<number>(0);
  const [showEntryScreen, setShowEntryScreen] = useState(false);
  const [effectiveTeams, setEffectiveTeams] = useState<string[]>([]);
  const [highlightedTeam, setHighlightedTeam] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [showConfetti, setShowConfetti] = useState(false);
  const [backgroundPulse, setBackgroundPulse] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number, height: number }>({
    width: 0,
    height: 0
  });
  
  // Initialize window dimensions on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set up audio
    if (bidSoundRef.current) bidSoundRef.current.volume = 0.5;
    if (winSoundRef.current) winSoundRef.current.volume = 0.5;
    if (outbidSoundRef.current) outbidSoundRef.current.volume = 0.5;

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Clean up all intervals and timeouts on unmount
      intervalsRef.current.forEach(interval => clearInterval(interval));
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Cleanup function to safely add and track timeouts
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Cleanup function to safely add and track intervals
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = setInterval(callback, delay);
    intervalsRef.current.push(intervalId);
    return intervalId;
  }, []);

  const playSound = (type: 'bid' | 'win' | 'outbid') => {
    if (!soundEnabled) return;

    try {
      if (type === 'bid' && bidSoundRef.current) {
        bidSoundRef.current.currentTime = 0;
        bidSoundRef.current.play().catch(() => {});
      } else if (type === 'win' && winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(() => {});
      } else if (type === 'outbid' && outbidSoundRef.current) {
        outbidSoundRef.current.currentTime = 0;
        outbidSoundRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handlePayEntryFee = async () => {
    setShowPaymentModal(true);
    setTransactionStatus('processing');

    // Send real transaction from user wallet
    if (provider && walletAddress) {
      try {
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: MODERATOR_ADDRESS,
          value: ethers.parseEther(ENTRY_FEE.toString()),
          gasLimit: 50000
        });
        await tx.wait();
        setTransactionHash(tx.hash);
        setTransactionStatus('confirmed');
        safeSetTimeout(() => {
          setShowPaymentModal(false);
          handleAIEntryFees();
        }, 1500);
        return;
      } catch (err) {
        setTransactionStatus('failed');
        setTransactionHash('');
        return;
      }
    }

    // fallback: simulate for demo if no provider
    safeSetTimeout(() => {
      setTransactionHash(generateFakeHash());
      setTransactionStatus('confirmed');
      safeSetTimeout(() => {
        setShowPaymentModal(false);
        handleAIEntryFees();
      }, 1500);
    }, 2000);
  };

  const handleAIEntryFees = () => {
    setShowEntryScreen(true);
    const interval = safeSetInterval(() => {
      setAiTransactionStatus(prev => {
        if (prev < 4) {
          playSound('bid');
          setHighlightedTeam(prev + 1);
          setEffectiveTeams(teams => [...teams, `AI Team ${prev + 1}`]);
          return prev + 1;
        }
        clearInterval(interval);
        safeSetTimeout(() => {
          playSound('win');
          setShowEntryScreen(false);
          startMatch();
        }, 1500);
        return prev;
      });
    }, 1200);
  };

  const startMatch = () => {
    setBackgroundPulse(true);
    safeSetTimeout(() => setBackgroundPulse(false), 1000);

    const user = getRandomPlayers(TEAM_SIZE);
    const ai1 = getRandomPlayers(TEAM_SIZE);
    const ai2 = getRandomPlayers(TEAM_SIZE);
    const ai3 = getRandomPlayers(TEAM_SIZE);
    const ai4 = getRandomPlayers(TEAM_SIZE);

    setUserTeam(user);
    setAiTeams([ai1, ai2, ai3, ai4]);
    setStarted(true);
  };

  const handleBattleEnd = (wins: number, losses: number) => {
    setResult({
      wins,
      losses,
      teamPerformance: {
        user: wins,
        ai1: Math.floor(Math.random() * 7),
        ai2: Math.floor(Math.random() * 7),
        ai3: Math.floor(Math.random() * 7),
        ai4: Math.floor(Math.random() * 7),
      }
    });
    setShowResult(true);

    if (wins > losses) {
      setShowConfetti(true);
      safeSetTimeout(() => setShowConfetti(false), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-blue-950 to-purple-950 text-white py-8 px-4 relative overflow-hidden">
      <ParticleBackground />

      {backgroundPulse && (
        <div className="fixed inset-0 bg-blue-500/10 animate-pulse-slow z-0" />
      )}

      {showConfetti && windowDimensions.width > 0 && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}

      <audio ref={bidSoundRef} src="/sounds/bid.mp3" preload="auto" />
      <audio ref={winSoundRef} src="/sounds/win.mp3" preload="auto" />
      <audio ref={outbidSoundRef} src="/sounds/outbid.mp3" preload="auto" />

      <div className="relative z-10">
        <motion.h1
          className="text-5xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 drop-shadow-glow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Quick Match
        </motion.h1>
        <motion.div
          className="text-lg text-center mb-8 text-blue-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Battle your cricket NFTs against AI teams
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {!isWalletConnected ? (
          <motion.div
            className="flex flex-col items-center justify-center mt-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/60 p-8 rounded-2xl shadow-glow mb-6 text-center max-w-md">
              <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Connect your wallet to play</h2>
              <p className="text-blue-300 mb-6">Compete in quick matches with your cricket NFTs against AI opponents!</p>
              <WalletConnector
                onWalletConnected={(address, balance, provider) => {
                  setProvider(provider);
                  setWalletAddress(address);
                  setWalletBalance(balance);
                  setIsWalletConnected(true);
                }}
              />
            </div>
          </motion.div>
        ) : !started && !showEntryScreen && !showPaymentModal ? (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/60 p-8 rounded-2xl shadow-glow mb-6 max-w-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Match</h2>
                  <p className="text-blue-300">Entry fee: {ENTRY_FEE} MOD</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ChevronsRight className="h-5 w-5" />
                  <span>Win rewards by defeating AI opponents</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <ChevronsRight className="h-5 w-5" />
                  <span>Compete with your cricket player NFTs</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <ChevronsRight className="h-5 w-5" />
                  <span>Use special powers to gain advantage</span>
                </div>
              </div>

              <div className="border-t border-blue-700/30 pt-6">
                <motion.button
                  className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg font-bold text-white shadow-lg hover:from-emerald-600 hover:to-blue-700 transition relative overflow-hidden group"
                  onClick={handlePayEntryFee}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Pay Entry Fee & Start Match</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></span>
                </motion.button>

                <div className="mt-4 text-center text-blue-300 text-sm">
                  Wallet Balance: {walletBalance.toFixed(2)} MOD
                </div>
              </div>
            </div>
          </motion.div>
        ) : showPaymentModal ? (
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogContent className="bg-gradient-to-br from-slate-900 to-blue-900/90 border-blue-700/50 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-blue-300">Processing Payment</DialogTitle>
              </DialogHeader>
              <div className="p-4 flex flex-col items-center">
                {transactionStatus === 'processing' ? (
                  <>
                    <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-center">Processing transaction...</p>
                  </>
                ) : transactionStatus === 'confirmed' ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <p className="text-center text-emerald-400 font-bold mb-2">Payment Confirmed!</p>
                    <p className="text-sm text-blue-300 break-all">{transactionHash}</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <p className="text-center text-red-400 font-bold">Transaction Failed</p>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ) : showEntryScreen ? (
          <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/60 p-8 rounded-2xl shadow-glow max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Match Preparation</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Your team is ready</span>
                </div>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>

              {[1, 2, 3, 4].map((team) => (
                <div key={team}>
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded-full ${team <= aiTransactionStatus ? 'bg-gradient-to-r from-emerald-400 to-blue-500' : 'bg-gray-700'} flex items-center justify-center ${highlightedTeam === team ? 'animate-pulse' : ''}`}>
                      {team <= aiTransactionStatus ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <span className="text-white text-xs">{team}</span>
                      )}
                    </div>
                    <span>AI Team {team}</span>
                    <span className={team <= aiTransactionStatus ? "text-emerald-400 font-bold" : "text-gray-400"}>
                      {team <= aiTransactionStatus ? "READY" : "WAITING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${(aiTransactionStatus + 1) / 5 * 100}%` }}
              />
            </div>
            <div className="text-center text-sm text-blue-300 mt-2">
              {aiTransactionStatus < 4 ? "Waiting for all teams to join..." : "Starting match..."}
            </div>
          </div>
        ) : started && !showResult ? (
          <TrumpCardBattle userTeam={userTeam} aiTeams={aiTeams} onBattleEnd={handleBattleEnd} />
        ) : showResult ? (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/60 p-8 rounded-2xl shadow-glow mb-6 max-w-lg">
              <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600">
                Match Results
              </h2>

              <div className="flex justify-center gap-8 my-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-1">{result.wins}</div>
                  <div className="text-blue-300">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-pink-400 mb-1">{result.losses}</div>
                  <div className="text-blue-300">Losses</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-indigo-300 mb-3">Team Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Y</span>
                      </div>
                      <span>Your Team</span>
                    </div>
                    <span className="font-bold">{result.teamPerformance.user} wins</span>
                  </div>
                  {[1, 2, 3, 4].map((ai) => (
                    <div key={ai}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-700 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">A{ai}</span>
                          </div>
                          <span>AI Team {ai}</span>
                        </div>
                        <span className="font-bold">{result.teamPerformance[`ai${ai}`]} wins</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-center">
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  {result.wins > result.losses ? 'Victory Reward!' : result.wins === result.losses ? 'Draw Reward' : 'Better luck next time'}
                </h3>
                <div className="text-2xl font-bold mb-2">
                  {result.wins > result.losses ? '+1.0 MOD' : result.wins === result.losses ? '+0.5 MOD' : '+0 MOD'}
                </div>
                <div className="text-sm text-blue-300">
                  {result.wins > result.losses
                    ? "You won the match and earned a reward!"
                    : result.wins === result.losses
                      ? "It was a draw. You got your entry fee back."
                      : "You lost the match. Try again next time!"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                <motion.button
                  className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg font-bold text-white shadow-lg hover:from-emerald-600 hover:to-blue-700 transition"
                  onClick={() => window.location.reload()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Again
                </motion.button>
                <motion.button
                  className="py-3 px-6 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg font-bold text-white shadow-lg hover:from-slate-700 hover:to-slate-900 transition"
                  onClick={() => window.location.href = "/"}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Home
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default QuickMatchPage;
