import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Shuffle, SkipForward, Volume2, VolumeX, Trophy } from 'lucide-react';
import { motion as m } from 'framer-motion';

// Types for player and stats
interface Player {
  id: string;
  name: string;
  team: string;
  photo: string;
  rarity: string;
  stats: {
    Batting: number;
    Bowling: number;
    Fitness: number;
    Popularity: number;
  };
}

interface TrumpCardBattleProps {
  userTeam: Player[];
  aiTeams: Player[][]; // 4 AI teams
  onBattleEnd: (wins: number, losses: number) => void;
}

const STAT_KEYS = ['Batting', 'Bowling', 'Fitness', 'Popularity'] as const;

type StatKey = typeof STAT_KEYS[number];

const AI_TAUNTS = [
  "Better luck next time!",
  "Is that all you've got?",
  "You can't beat the bots!",
  "Nice try, human!",
  "AI power!",
  "That was close!",
  "Impressive move!",
  "You'll need more than that!"
];

// Define available powers
const POWERS = [
  { key: 'double', label: 'Double', desc: 'Double your stat this round!' },
  { key: 'skip', label: 'Skip', desc: 'Skip this battle (no win/loss)' },
  { key: 'swap', label: 'Swap', desc: 'Swap your card with AI for this battle!' },
];

type PowerKey = 'double' | 'skip' | 'swap' | null;

interface CyberStatProps {
  label: string;
  value: number;
  isSelected?: boolean;
  onClick?: () => void;
}

interface CyberCardProps {
  player: Player | null;
  isFlipped?: boolean;
  showStats?: boolean;
  onStatSelect?: (stat: StatKey) => void;
  selectedStat?: StatKey | null;
  isAI?: boolean;
  highlightStat?: StatKey | null;
  size?: "sm" | "md" | "lg";
}

const TrumpCardBattle: React.FC<TrumpCardBattleProps> = ({ userTeam, aiTeams, onBattleEnd }) => {
  const [round, setRound] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [winner, setWinner] = useState<'user' | 'ai' | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [aiResults, setAiResults] = useState<{ ai: number; result: 'win' | 'lose' | 'draw' }[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [currentAi, setCurrentAi] = useState(0);
  const [aiTaunt, setAiTaunt] = useState('');
  const [statAnimValue, setStatAnimValue] = useState<number | null>(null);
  const statAnimRef = useRef<NodeJS.Timeout | null>(null);
  const battleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCoin, setShowCoin] = useState(false);
  const [finalResult, setFinalResult] = useState<'victory'|'defeat'|'draw'|null>(null);
  const [userPower, setUserPower] = useState<PowerKey>(null);
  const [aiPowers, setAiPowers] = useState<PowerKey[]>([null, null, null, null]);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [offeredPower, setOfferedPower] = useState<PowerKey>(null);
  const [offeredPowerDesc, setOfferedPowerDesc] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStat, setSelectedStat] = useState<StatKey | null>(null);
  const [revealedOpponent, setRevealedOpponent] = useState(false);
  const [battleInProgress, setBattleInProgress] = useState(false);
  const [cardAnimation, setCardAnimation] = useState<'idle' | 'hover' | 'flip' | 'shake' | 'victory' | 'defeat'>('idle');
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [aiSelectedStat, setAiSelectedStat] = useState<StatKey | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [highlightStat, setHighlightStat] = useState<StatKey | null>(null);

  // Sound effects
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);
  const selectSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      flipSoundRef.current = new Audio('/sounds/bid.mp3');
      winSoundRef.current = new Audio('/sounds/win.mp3');
      loseSoundRef.current = new Audio('/sounds/outbid.mp3');
      selectSoundRef.current = new Audio('/sounds/bid.mp3');

      if (flipSoundRef.current) flipSoundRef.current.volume = 0.5;
      if (winSoundRef.current) winSoundRef.current.volume = 0.5;
      if (loseSoundRef.current) loseSoundRef.current.volume = 0.5;
      if (selectSoundRef.current) selectSoundRef.current.volume = 0.3;
    }

    return () => {
      cleanupAnimations();
    };
  }, []);

  const POWER_ICONS: Record<Exclude<PowerKey, null>, JSX.Element> = {
    double: <Zap className="inline w-6 h-6 text-yellow-400" />, // Double
    skip: <SkipForward className="inline w-6 h-6 text-blue-400" />, // Skip
    swap: <Shuffle className="inline w-6 h-6 text-pink-400" /> // Swap
  };

  // Cleanup function to clear all timers and animation states
  const cleanupAnimations = () => {
    if (statAnimRef.current) {
      clearInterval(statAnimRef.current);
      statAnimRef.current = null;
    }
    if (battleTimeoutRef.current) {
      clearTimeout(battleTimeoutRef.current);
      battleTimeoutRef.current = null;
    }
  };

  // Sound effect handling
  const playSound = (type: 'flip' | 'win' | 'lose' | 'select') => {
    if (!soundEnabled) return;
    
    try {
      if (type === 'flip' && flipSoundRef.current) {
        flipSoundRef.current.currentTime = 0;
        flipSoundRef.current.play().catch(() => {});
      }
      if (type === 'win' && winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(() => {});
      }
      if (type === 'lose' && loseSoundRef.current) {
        loseSoundRef.current.currentTime = 0;
        loseSoundRef.current.play().catch(() => {});
      }
      if (type === 'select' && selectSoundRef.current) {
        selectSoundRef.current.currentTime = 0;
        selectSoundRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };
  
  useEffect(() => { 
    if (flipped) playSound('flip'); 
  }, [flipped]);
  
  useEffect(() => {
    if (aiResults.length > 0 && flipped) {
      const last = aiResults[aiResults.length-1];
      if (last.result === 'win') {
        playSound('win');
        setShowCoin(true);
        const coinTimeout = setTimeout(() => setShowCoin(false), 900);
        return () => clearTimeout(coinTimeout);
      } else if (last.result === 'lose') {
        playSound('lose');
      }
    }
  }, [aiResults, flipped]);
  
  useEffect(() => {
    if (showResult) {
      if (wins > losses) {
        setFinalResult('victory');
        playSound('win');
      } else if (losses > wins) {
        setFinalResult('defeat');
        playSound('lose');
      } else {
        setFinalResult('draw');
      }
    }
  }, [showResult]);

  // Reset state for new round
  useEffect(() => {
    cleanupAnimations();
    setSelectedStat(null);
    setRevealedOpponent(false);
    setCardAnimation('idle');
    setStatAnimValue(null);
    setHighlightStat(null);
  }, [round]);

  // Power offer for new round
  useEffect(() => {
    if (!hasMounted) return;
    if (!flipped && !showResult) {
      if (Math.random() < 0.3) {
        const idx = Math.floor(Math.random() * POWERS.length);
        setOfferedPower(POWERS[idx].key as PowerKey);
        setOfferedPowerDesc(POWERS[idx].desc);
        setShowPowerModal(true);
      } else {
        setOfferedPower(null);
        setShowPowerModal(false);
      }
      setAiPowers(
        [0,1,2,3].map(() => (Math.random() < 0.3 ? POWERS[Math.floor(Math.random()*POWERS.length)].key as PowerKey : null))
      );
      setUserPower(null);
    }
  }, [round, hasMounted, flipped, showResult]);

  // Taunt typing animation
  const [typedTaunt, setTypedTaunt] = useState('');
  useEffect(() => {
    if (!aiTaunt) { 
      setTypedTaunt(''); 
      return; 
    }
    
    let idx = 0;
    setTypedTaunt('');
    
    const interval = setInterval(() => {
      setTypedTaunt(t => {
        if (idx >= aiTaunt.length) {
          clearInterval(interval);
          return t;
        }
        idx++;
        return t + aiTaunt[idx - 1];
      });
    }, 35);
    
    return () => clearInterval(interval);
  }, [aiTaunt]);

  // Alternate turn on round change
  useEffect(() => {
    setIsUserTurn(round % 2 === 0);
    setAiSelectedStat(null);
  }, [round]);

  // AI stat selection logic
  const aiPickStat = () => {
    const aiPlayer = aiTeams[0][round < aiTeams[0].length ? round : aiTeams[0].length - 1];
    let bestStat: StatKey = 'Batting';
    let bestValue = aiPlayer.stats['Batting'];
    STAT_KEYS.forEach(key => {
      if (aiPlayer.stats[key] > bestValue) {
        bestStat = key;
        bestValue = aiPlayer.stats[key];
      }
    });
    return bestStat;
  };

  // If it's AI's turn, pick stat and auto start battle
  useEffect(() => {
    if (!isUserTurn && !flipped && !showResult) {
      const stat = aiPickStat();
      setAiSelectedStat(stat);
      setSelectedStat(stat);
      setTimeout(() => {
        setBattleInProgress(true);
        handleFlip();
      }, 1200);
    }
  }, [isUserTurn, round, flipped, showResult]);

  if (!hasMounted) return null;

  if (!userTeam || !aiTeams || userTeam.length === 0 || aiTeams.length === 0 || round >= userTeam.length) {
    return <div className="text-white">Loading teams...</div>;
  }

  const userPlayer = userTeam[round];
  const aiPlayers = aiTeams.map(team => team[round < team.length ? round : team.length - 1]);

  const launchConfetti = () => {
    // This would be implemented in the actual code
    console.log("Confetti!");
  };

  const getStatColor = (value: number) => {
    if (value > 75) return 'from-emerald-500 to-green-600';
    if (value > 50) return 'from-blue-500 to-indigo-600';
    if (value > 25) return 'from-amber-500 to-orange-600';
    return 'from-rose-500 to-pink-600';
  };

  const renderPowerModal = () => (
    showPowerModal && offeredPower ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <m.div 
          className="bg-gradient-to-br from-slate-900/90 to-blue-900/80 rounded-lg p-8 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.5)] text-center max-w-xs w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-300">
            <Sparkles className="w-10 h-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          </div>
          <div className="mb-4">{offeredPower !== null ? POWER_ICONS[offeredPower] : null}</div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-3 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">POWER UP!</h2>
          <div className="text-lg text-white mb-2">You got <span className="font-bold text-cyan-400">{POWERS.find(p=>p.key===offeredPower)?.label}</span></div>
          <div className="text-indigo-300 mb-6 italic">{offeredPowerDesc}</div>
          <div className="flex space-x-3 justify-center">
            <button 
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded font-bold hover:from-cyan-600 hover:to-blue-700 transition shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              onClick={()=>{setUserPower(offeredPower);setShowPowerModal(false);}}
            >
              Use Power
            </button>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded font-bold hover:from-gray-800 hover:to-gray-950 transition"
              onClick={()=>{setUserPower(null);setShowPowerModal(false);}}
            >
              Skip
            </button>
          </div>
        </m.div>
      </div>
    ) : null
  );

  const handleStatSelection = (stat: StatKey) => {
    if (!isUserTurn || battleInProgress || flipped) return;
    setSelectedStat(stat);
    setHighlightStat(stat);
    playSound('select');
    setCardAnimation('hover');
    if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    battleTimeoutRef.current = setTimeout(() => {
      setBattleInProgress(true);
      handleFlip();
    }, 800);
  };

  const handleFlip = () => {
    if (!selectedStat) return;
    
    setCardAnimation('flip');
    setFlipped(true);
    setCurrentAi(0);
    setAiResults([]);
    setShowRecap(false);
    setAiTaunt('');
    
    if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    
    battleTimeoutRef.current = setTimeout(() => {
      handleAiBattle(0);
      setRevealedOpponent(true);
    }, 700);
  };

  const handleAiBattle = (aiIdx: number) => {
    // Clean up previous animation if any
    if (statAnimRef.current) {
      clearInterval(statAnimRef.current);
      statAnimRef.current = null;
    }
    
    if (aiIdx >= aiPlayers.length || !selectedStat) {
      battleTimeoutRef.current = setTimeout(() => {
        setShowRecap(true);
        setBattleInProgress(false);
      }, 600);
      return;
    }
    
    setCurrentAi(aiIdx);
    setAiTaunt(AI_TAUNTS[Math.floor(Math.random() * AI_TAUNTS.length)]);
    
    let userStat = userPlayer.stats[selectedStat];
    let aiStat = aiPlayers[aiIdx].stats[selectedStat];
    
    let skipBattle = false;
    
    // Apply powers
    if (userPower === 'double') userStat *= 2;
    if (userPower === 'swap') {
      const temp = userStat; userStat = aiStat; aiStat = temp;
    }
    if (userPower === 'skip') skipBattle = true;
    
    if (aiPowers[aiIdx] === 'double') aiStat *= 2;
    if (aiPowers[aiIdx] === 'swap') {
      const temp = userStat; userStat = aiStat; aiStat = temp;
    }
    if (aiPowers[aiIdx] === 'skip') skipBattle = true;
    
    setStatAnimValue(0);
    
    // Use requestAnimationFrame for smoother animation
    let startTime: number;
    const duration = 1000; // 1 second for animation
    const maxVal = Math.max(userStat, aiStat);
    
    const animateStats = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setStatAnimValue(Math.ceil(progress * maxVal));
      
      if (progress < 1) {
        // Continue animation
        statAnimRef.current = setTimeout(() => {
          requestAnimationFrame(animateStats);
        }, 16) as any; // ~60fps
      } else {
        // Animation completed
        setStatAnimValue(null);
        
        let result: 'win' | 'lose' | 'draw' = 'draw';
        
        if (!skipBattle) {
          if (userStat > aiStat) {
            result = 'win';
            setCardAnimation('victory');
          }
          else if (aiStat > userStat) {
            result = 'lose';
            setCardAnimation('defeat');
          }
        }
        
        setAiResults(prev => [...prev, { ai: aiIdx, result }]);
        
        // Move to next AI opponent
        battleTimeoutRef.current = setTimeout(() => {
          handleAiBattle(aiIdx + 1);
        }, 900);
      }
    };
    
    // Start animation
    requestAnimationFrame(animateStats);
  };

  const handleNext = () => {
    cleanupAnimations();
    setFlipped(false);
    setWinner(null);
    setShowRecap(false);
    setAiTaunt('');
    setStatAnimValue(null);
    setSelectedStat(null);
    setRevealedOpponent(false);
    setCardAnimation('idle');
    const roundWins = aiResults.filter(r => r.result === 'win').length;
    const roundLosses = aiResults.filter(r => r.result === 'lose').length;
    setWins(w => w + roundWins);
    setLosses(l => l + roundLosses);
    if (round < 6) {
      setRound(r => r + 1);
      setIsUserTurn(turn => !turn);
    } else {
      setShowResult(true);
      onBattleEnd(wins + roundWins, losses + roundLosses);
    }
  };

  const getCardAnimationClass = (animation: string) => {
    switch (animation) {
      case 'hover': return 'animate-pulse transform hover:scale-105';
      case 'flip': return 'animate-flip';
      case 'shake': return 'animate-shake';
      case 'victory': return 'animate-bounce-once';
      case 'defeat': return 'animate-shake';
      default: return '';
    }
  };

  const CyberStat: React.FC<CyberStatProps> = ({ label, value, isSelected = false, onClick }) => (
    <m.button
      className={`w-full py-1.5 px-2 rounded relative overflow-hidden ${isSelected ? 'cursor-default' : 'hover:scale-105 transition-transform'} ${isSelected ? 'shadow-[0_0_8px_rgba(6,182,212,0.7)]' : ''}`}
      whileHover={!isSelected ? { scale: 1.03 } : {}}
      whileTap={!isSelected ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={isSelected}
    >
      <div className={`absolute inset-0 ${isSelected ? 'bg-gradient-to-r from-cyan-600 to-blue-900' : 'bg-gradient-to-r from-gray-900 to-slate-800'}`} />
      <div className={`absolute inset-0 opacity-20 ${isSelected ? 'bg-grid-pattern' : ''}`} />
      
      {isSelected && (
        <div className="absolute inset-0 border border-cyan-400 opacity-70" />
      )}
      
      <div className="relative flex items-center justify-between">
        <div className="text-sm font-mono font-semibold text-gray-300">{label}</div>
        <div className={`font-mono font-bold text-lg ${isSelected ? 'text-white' : 'text-cyan-400'}`}>{value}</div>
      </div>
      
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
      )}
    </m.button>
  );

  const CyberCard: React.FC<CyberCardProps> = ({ player, isFlipped = false, showStats = true, onStatSelect, selectedStat = null, isAI = false, highlightStat = null, size = "lg" }) => {
    const sizeClasses = {
      sm: "w-36 h-52",
      md: "w-44 h-64",
      lg: "w-52 h-72"
    };
    
    return (
      <m.div 
        className={`relative ${sizeClasses[size]} perspective shadow-[0_0_20px_rgba(14,165,233,0.3)] rounded-md overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={`transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''} w-full h-full`} style={{ transformStyle: 'preserve-3d' }}>
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden">
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
              {/* Header bar */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-800 h-1.5"></div>
              
              {/* Card content */}
              <div className="p-3 flex flex-col items-center flex-1">
                {/* Player image */}
                <div className="relative mb-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-900 to-slate-900 p-0.5">
                    {player?.photo ? (
                      <img 
                        src={player.photo} 
                        alt={player.name || "Player"} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-3xl text-slate-500">?</div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full p-0.5">
                    <div className="bg-slate-900 rounded-full p-1">
                      <span className="text-xs font-mono font-bold text-cyan-400">{player?.rarity || "?"}</span>
                    </div>
                  </div>
                </div>
                
                {/* Player name */}
                <h3 className="text-white font-bold text-center mb-1">{player?.name || "Mystery Player"}</h3>
                <p className="text-cyan-400 text-xs mb-3 text-center font-mono">{player?.team || "Unknown Team"}</p>
                
                {/* Stats */}
                {showStats && player ? (
                  <div className="w-full space-y-2 mt-auto">
                    {STAT_KEYS.map(stat => (
                      <div
                        key={stat}
                        onClick={() => onStatSelect && onStatSelect(stat)}
                        className={`cursor-pointer ${selectedStat === stat ? 'animate-pulse' : ''}`}
                      >
                        <CyberStat
                          label={stat}
                          value={player.stats[stat]}
                          isSelected={highlightStat === stat}
                          onClick={() => onStatSelect && onStatSelect(stat)}
                        />
                      </div>
                    ))}
                  </div>
                ) : isAI ? (
                  <div className="flex flex-col items-center justify-center mt-4">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-cyan-400 text-sm font-mono animate-pulse">LOCKED</p>
                  </div>
                ) : !selectedStat ? (
                  <div className="text-center mt-4">
                    <p className="text-cyan-400 font-mono text-sm animate-pulse">SELECT STAT</p>
                  </div>
                ) : (
                  <div className="text-center mt-4">
                    <p className="text-cyan-400 font-mono text-sm">{selectedStat} SELECTED</p>
                  </div>
                )}
              </div>
              
              {/* Footer bar */}
              <div className="bg-gradient-to-r from-blue-800 to-cyan-600 h-1.5"></div>
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-800 h-1.5"></div>
              
              {/* Content */}
              <div className="p-3 flex flex-col items-center">
                {/* Player image */}
                <div className="relative mb-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-900 to-slate-900 p-0.5">
                    {player?.photo ? (
                      <img 
                        src={player.photo} 
                        alt={player.name || "Player"} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-2xl text-slate-500">?</div>
                    )}
                  </div>
                </div>
                
                {/* Player name */}
                <h3 className="text-white font-bold text-sm text-center">{player?.name || "Mystery Player"}</h3>
                <p className="text-cyan-400 text-xs mb-2 text-center font-mono">{player?.team || "Unknown Team"}</p>
                
                {/* Stats */}
                <div className="w-full space-y-1.5 mt-auto">
                  {STAT_KEYS.map(stat => (
                    <div 
                      key={stat}
                      className={`bg-gradient-to-r ${getStatColor(player?.stats[stat] || 0)} h-3 rounded-sm relative ${stat === selectedStat ? 'shadow-[0_0_10px_rgba(6,182,212,0.8)]' : ''}`} 
                      style={{ width: `${player?.stats[stat] || 0}%` }}
                    >
                      {stat === selectedStat && (
                        <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                      )}
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[0.65rem] font-mono font-bold text-white">
                        {stat[0]}:{player?.stats[stat] || '?'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-800 to-cyan-600 h-1.5"></div>
            </div>
          </div>
        </div>
      </m.div>
    );
  };

  if (showResult) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <m.div 
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.2)] p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center">
          <m.div
            className="mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 8, delay: 0.2 }}
          >
            {finalResult === 'victory' ? (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            ) : finalResult === 'defeat' ? (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11h4m-2-2v4M4 8l16 8m-16 0l16-8"/></svg>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
              </div>
            )}
          </m.div>
          
          <m.h1 
            className="text-4xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 10, delay: 0.4 }}
          >
            {finalResult === 'victory' ? 'VICTORY!' : finalResult === 'defeat' ? 'DEFEAT!' : 'DRAW!'}
          </m.h1>
          
          <m.div
            className="flex gap-6 mb-6"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-emerald-500 mb-1">{wins}</div>
              <div className="text-cyan-400 font-mono">WINS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-rose-500 mb-1">{losses}</div>
              <div className="text-cyan-400 font-mono">LOSSES</div>
            </div>
          </m.div>
          
          <m.div
            className="bg-slate-800/50 rounded-lg p-4 mb-6 w-full max-w-md font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 pb-2 border-b border-cyan-800/50 text-center">REWARDS</h3>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-yellow-400">
                {finalResult === 'victory' ? '+1.0 MOD' : finalResult === 'draw' ? '+0.5 MOD' : '+0 MOD'}
              </div>
              <div className="text-indigo-300 text-sm">
                {finalResult === 'victory'
                  ? "You dominated the match and earned bonus rewards!"
                  : finalResult === 'draw'
                    ? "An even match. You got your entry fee back."
                    : "Better luck next time! No rewards earned."
                }
              </div>
            </div>
          </m.div>
          
          <m.div 
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <button 
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded text-white font-bold hover:from-cyan-600 hover:to-blue-700 transition shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              onClick={() => window.location.reload()}
            >
              PLAY AGAIN
            </button>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 rounded text-white font-bold hover:from-slate-800 hover:to-slate-900 transition"
              onClick={() => window.location.href = "/"}
            >
              EXIT
            </button>
          </m.div>
        </div>
      </m.div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pt-6 px-2 relative">
      {/* Sound toggle */}
      <button
        className="absolute top-4 right-4 z-50 bg-slate-800/80 rounded-full p-2 shadow hover:bg-slate-700 transition"
        onClick={() => setSoundEnabled(v => !v)}
        title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
      >
        {soundEnabled ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-pink-400" />}
      </button>

      {renderPowerModal()}
      
      {/* Progress and Score */}
      <div className="mb-8 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-4 rounded-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.2)]">
        <div className="flex justify-between items-center mb-2">
          <div className="font-mono text-cyan-400">ROUND {round + 1}<span className="text-gray-500">/7</span></div>
          <div className="flex gap-4">
            <div className="bg-gradient-to-r from-emerald-800 to-green-900 px-3 py-1 rounded font-mono text-white">
              YOU <span className="text-emerald-300 font-bold">{wins}</span>
            </div>
            <div className="bg-gradient-to-r from-rose-800 to-pink-900 px-3 py-1 rounded font-mono text-white">
              AI <span className="text-rose-300 font-bold">{losses}</span>
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${((round + 1) / 7) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Instructions */}
      {!selectedStat && !flipped && (
        <div className="text-center mb-6">
          {isUserTurn ? (
            <div className="font-mono text-cyan-400 text-lg animate-pulse">SELECT A STAT TO COMPETE WITH</div>
          ) : (
            <div className="font-mono text-indigo-400 text-lg animate-pulse">AI IS SELECTING...</div>
          )}
        </div>
      )}
      
      {/* Battle Area */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center mb-8">
        {/* User Card */}
        <div className={`${getCardAnimationClass(cardAnimation)}`}>
          <CyberCard 
            player={userPlayer} 
            isFlipped={flipped}
            showStats={!flipped}
            onStatSelect={handleStatSelection}
            selectedStat={selectedStat}
            highlightStat={highlightStat}
            size="lg"
          />
        </div>
        
        {/* VS */}
        <div className="flex flex-col items-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-pink-600 drop-shadow-[0_0_5px_rgba(244,114,182,0.5)]">VS</div>
          {userPower && (
            <div className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-600 to-amber-700 rounded-full text-xs text-white font-mono">
              {POWER_ICONS[userPower]} POWER ACTIVE
            </div>
          )}
        </div>
        
        {/* AI Cards */}
        <div className="flex flex-wrap gap-3 justify-center max-w-sm">
          {aiPlayers.map((aiPlayer, idx) => (
            <div 
              key={idx} 
              className={`${currentAi === idx && flipped ? 'scale-110 z-10' : ''} transition-transform duration-300`}
            >
              <CyberCard 
                player={revealedOpponent ? aiPlayer : null} 
                isFlipped={flipped}
                showStats={false}
                isAI={true}
                selectedStat={selectedStat}
                size="sm"
              />
              {aiPowers[idx] && flipped && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center shadow-[0_0_5px_rgba(202,138,4,0.8)]">
                    {POWER_ICONS[aiPowers[idx]]}
                  </div>
                </div>
              )}
              {flipped && aiResults[idx] && (
                <div className="mt-1 text-center">
                  <span className={`
                    font-mono text-xs px-2 py-0.5 rounded
                    ${aiResults[idx].result === 'win' ? 'bg-emerald-900/80 text-emerald-300' : 
                      aiResults[idx].result === 'lose' ? 'bg-rose-900/80 text-rose-300' : 
                      'bg-amber-900/80 text-amber-300'}
                  `}>
                    {aiResults[idx].result.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Battle Info */}
      {flipped && (
        <div className="mb-6 text-center">
          <div className="font-mono text-cyan-400 min-h-[1.5em]">
            {typedTaunt}
          </div>
          {statAnimValue !== null && (
            <div className="text-2xl font-mono font-bold text-yellow-400 animate-pulse mt-2">
              {statAnimValue}
            </div>
          )}
        </div>
      )}
      
      {/* Round Recap */}
      {showRecap && (
        <m.div 
          className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 rounded-lg border border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.2)] max-w-md mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">ROUND RECAP</h2>
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {aiResults.map((r, idx) => (
              <div 
                key={idx} 
                className={`px-3 py-2 rounded font-mono font-bold flex items-center gap-1.5
                  ${r.result === 'win' ? 'bg-gradient-to-r from-emerald-700 to-green-900 text-emerald-300' : 
                    r.result === 'lose' ? 'bg-gradient-to-r from-rose-700 to-pink-900 text-rose-300' : 
                    'bg-gradient-to-r from-amber-700 to-yellow-900 text-amber-300'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs 
                  ${r.result === 'win' ? 'bg-emerald-900 text-emerald-200' : 
                    r.result === 'lose' ? 'bg-rose-900 text-rose-200' : 
                    'bg-amber-900 text-amber-200'}`}>
                  {r.ai+1}
                </span>
                <span>{r.result === 'win' ? 'WIN' : r.result === 'lose' ? 'LOSS' : 'DRAW'}</span>
              </div>
            ))}
          </div>
          
          <button
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] hover:from-cyan-600 hover:to-blue-700 transition"
            onClick={handleNext}
          >
            {round < 6 ? 'NEXT ROUND' : 'FINISH'}
          </button>
        </m.div>
      )}
    </div>
  );
};

export default TrumpCardBattle;

<style jsx global>{`
@keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.animate-spin-slow { animation: spin-slow 2.5s linear infinite; }

@keyframes flip {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(180deg); }
}
.animate-flip { animation: flip 0.7s ease-in-out; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.animate-shake { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

@keyframes bounce-once {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-once { animation: bounce-once 0.5s ease-in-out; }

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.animate-fade-in { animation: fade-in 0.3s ease-in-out; }

.backface-hidden {
  backface-visibility: hidden;
}

.perspective {
  perspective: 1000px;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.drop-shadow-glow {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.7));
}

.bg-grid-pattern {
  background-image: linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
  background-size: 10px 10px;
}
`}</style>
