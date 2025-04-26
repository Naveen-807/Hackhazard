import React, { useState, useEffect, useRef } from 'react';

// Types for player and stats
export interface Player {
  id: string;
  name: string;
  team: string;
  rarity: string;
  photo: string;
  stats: {
    [key: string]: number;
  };
}

interface TrumpCardBattleProps {
  userTeam: Player[];
  aiTeams: Player[][];
  onBattleEnd?: (wins: number, losses: number) => void;
}

// Constants for the game - updated to use real cricket statistics
const STAT_KEYS = ['Batting', 'Strike Rate', 'Experience', 'Running', 'Fielding'];
const ROUND_TIME_SECONDS = 20;
const MAX_ROUNDS = 5;
const NUM_OPPONENTS = 4;

export const TrumpCardBattle: React.FC<TrumpCardBattleProps> = ({ userTeam, aiTeams, onBattleEnd }) => {
  // Game state
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);
  const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([]);
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [userStats, setUserStats] = useState({ score: 0, wins: 0, losses: 0 });
  const [round, setRound] = useState(1);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'ready' | 'selecting' | 'revealing' | 'roundComplete' | 'gameOver'>('ready');
  const [winners, setWinners] = useState<('user' | 'opponent' | 'draw')[]>([]);
  const [countdown, setCountdown] = useState(ROUND_TIME_SECONDS);
  const [highlightStat, setHighlightStat] = useState<string | null>(null);
  const [cardsRevealed, setCardsRevealed] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const bidSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const outbidSound = useRef<HTMLAudioElement | null>(null);

  // Timer ref for countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  useEffect(() => {
    // Load audio sounds
    bidSound.current = new Audio('/sounds/bid.mp3');
    winSound.current = new Audio('/sounds/win.mp3');
    outbidSound.current = new Audio('/sounds/outbid.mp3');

    // Create and store AudioContext when needed (on first user interaction)
    const handleUserInteraction = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      document.removeEventListener('click', handleUserInteraction);
    };
    document.addEventListener('click', handleUserInteraction);

    // Use the provided userTeam and AI teams for the game
    if (userTeam.length > 0 && aiTeams.length > 0) {
      const allPlayers = [...userTeam, ...aiTeams.flat()];
      setPlayerPool(allPlayers);

      // Set up initial players
      initializeGame();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [userTeam, aiTeams]);

  // Initialize the game with players
  const initializeGame = () => {
    // Set user player
    const userCardIndex = round % userTeam.length;
    setUserPlayer(userTeam[userCardIndex]);

    // Set opponent players (one from each AI team)
    const opponents: Player[] = [];
    for (let i = 0; i < NUM_OPPONENTS; i++) {
      const teamIndex = i % aiTeams.length;
      const playerIndex = round % aiTeams[teamIndex].length;
      opponents.push(aiTeams[teamIndex][playerIndex]);
    }
    setOpponentPlayers(opponents);

    // Reset game state
    setWinners([]);
    setCardsRevealed(false);
    setGameStatus('selecting');
  };

  // Function to start a new round
  const startNewRound = () => {
    // Update player cards for the new round
    const userCardIndex = round % userTeam.length;
    setUserPlayer(userTeam[userCardIndex]);

    const newOpponents: Player[] = [];
    for (let i = 0; i < NUM_OPPONENTS; i++) {
      const teamIndex = i % aiTeams.length;
      const playerIndex = (round + i) % aiTeams[teamIndex].length;
      newOpponents.push(aiTeams[teamIndex][playerIndex]);
    }
    setOpponentPlayers(newOpponents);

    // Reset round state
    setWinners([]);
    setCardsRevealed(false);
    setSelectedStat(null);
    setHighlightStat(null);
    setGameStatus('selecting');
    setCountdown(ROUND_TIME_SECONDS);

    // Start countdown
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          selectRandomStat();
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle selecting a stat
  const handleStatSelect = (stat: string) => {
    if (gameStatus !== 'selecting' || !userPlayer) return;

    if (bidSound.current) bidSound.current.play().catch(e => console.log('Error playing sound:', e));
    setSelectedStat(stat);
    setGameStatus('revealing');

    if (timerRef.current) clearInterval(timerRef.current);

    // Compare stats and determine winners for all opponents
    setTimeout(() => {
      const userValue = userPlayer.stats[stat];
      const roundWinners: ('user' | 'opponent' | 'draw')[] = [];
      let totalWins = 0;
      let totalLosses = 0;

      // Compare against each opponent
      opponentPlayers.forEach(opponent => {
        const opponentValue = opponent.stats[stat];

        if (userValue > opponentValue) {
          roundWinners.push('user');
          totalWins++;
        } else if (opponentValue > userValue) {
          roundWinners.push('opponent');
          totalLosses++;
        } else {
          roundWinners.push('draw');
        }
      });

      // Reveal the cards
      setCardsRevealed(true);

      // Update user stats
      setUserStats(prev => ({
        ...prev,
        score: prev.score + totalWins + (4 - totalWins - totalLosses) * 0.5,
        wins: prev.wins + totalWins,
        losses: prev.losses + totalLosses
      }));

      setWinners(roundWinners);
      setHighlightStat(stat);
      setGameStatus('roundComplete');

      // Play appropriate sound based on overall result
      if (totalWins > totalLosses) {
        if (winSound.current) winSound.current.play().catch(e => console.log('Error playing sound:', e));
      } else if (totalLosses > totalWins) {
        if (outbidSound.current) outbidSound.current.play().catch(e => console.log('Error playing sound:', e));
      }
    }, 1000);
  };

  // Bot selects a stat randomly when time runs out
  const selectRandomStat = () => {
    if (gameStatus !== 'selecting' || !userPlayer) return;

    // Select a random stat
    const randomIndex = Math.floor(Math.random() * STAT_KEYS.length);
    const selectedStat = STAT_KEYS[randomIndex];

    handleStatSelect(selectedStat);
  };

  // Move to next round
  const handleNextRound = () => {
    if (round >= MAX_ROUNDS) {
      setGameStatus('gameOver');
      if (onBattleEnd) {
        onBattleEnd(userStats.wins, userStats.losses);
      }
    } else {
      setRound(prevRound => prevRound + 1);
      startNewRound();
    }
  };

  // Restart the game
  const handleRestart = () => {
    setUserStats({ score: 0, wins: 0, losses: 0 });
    setRound(1);
    initializeGame();
  };

  // Calculate overall round result
  const getRoundResult = () => {
    const wins = winners.filter(w => w === 'user').length;
    const losses = winners.filter(w => w === 'opponent').length;

    if (wins > losses) return 'won';
    if (losses > wins) return 'lost';
    return 'tied';
  };

  // Function to get description for each stat
  const getStatDescription = (stat: string): string => {
    switch (stat) {
      case 'Batting':
        return 'Batting average, reflecting consistent run-scoring ability';
      case 'Strike Rate':
        return 'Scoring rate per 100 balls faced - higher is better';
      case 'Experience':
        return 'Number of matches played, indicating player experience';
      case 'Running':
        return 'Running between wickets and speed on the field';
      case 'Fielding':
        return 'Fielding ability, including catching and ground fielding';
      default:
        return '';
    }
  };

  // Create stat bar component for reuse
  const StatBar = ({ value, max = 100, highlight = false }) => (
    <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${highlight ? 'bg-yellow-400' : 'bg-blue-500'}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  // Generate the player card component
  const PlayerCard = ({
    player,
    isUser = false,
    index = -1,
    isHidden = false,
    highlighted = false,
    compact = false
  }) => {
    if (!player) return <div className="h-full w-full bg-slate-800/50 rounded-2xl animate-pulse"></div>;

    if (isHidden) {
      return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-purple-900/60 to-purple-950/60 p-3 shadow-lg h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="text-center relative z-10">
            <div className="w-12 h-12 bg-purple-700/50 rounded-full mx-auto mb-2 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="text-sm font-bold">Opponent {index + 1}</div>
          </div>
        </div>
      );
    }

    // Determine if this card won or lost
    let resultStyle = '';
    if (index >= 0 && winners[index]) {
      if (winners[index] === 'user') {
        resultStyle = 'border-green-500 border-2';
      } else if (winners[index] === 'opponent') {
        resultStyle = 'border-red-500 border-2';
      } else {
        resultStyle = 'border-yellow-500 border-2';
      }
    }

    // Get player rarity color
    const getRarityColor = (rarity: string) => {
      switch (rarity.toLowerCase()) {
        case 'legendary': return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black';
        case 'epic': return 'bg-gradient-to-r from-purple-600 to-indigo-400';
        case 'rare': return 'bg-gradient-to-r from-blue-600 to-cyan-400';
        default: return 'bg-gradient-to-r from-slate-500 to-slate-400';
      }
    };

    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${
          isUser ? 'from-blue-900 to-blue-950' : 'from-purple-900 to-purple-950'
        } p-2 shadow-lg transition-all duration-300 ${
          highlighted ? 'ring-2 ring-yellow-400' : ''
        } ${resultStyle}`}
      >
        {/* Compact layout for user cards */}
        {compact || !isUser ? (
          <div className="flex items-start">
            {/* Player image */}
            <div className="relative w-1/3 aspect-square overflow-hidden rounded-lg bg-black/20 flex-shrink-0">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${player.photo})`,
                  filter: 'brightness(0.85)'
                }}
              />
              {/* Rarity indicator */}
              <div className={`absolute top-1 right-1 ${getRarityColor(player.rarity)} px-1.5 py-0.5 rounded-full text-xs font-bold shadow-md text-[10px]`}>
                {player.rarity}
              </div>
            </div>

            <div className="flex-1 ml-2 min-w-0">
              {/* Player name and team */}
              <div className="mb-1">
                <div className="text-sm font-bold truncate">{player.name}</div>
                <div className="text-xs text-blue-300 truncate">{player.team}</div>
              </div>

              {/* Stats display */}
              <div className="space-y-1">
                {STAT_KEYS.map(stat => (
                  <div
                    key={stat}
                    className={`p-1 rounded-lg ${
                      highlightStat === stat ? 'bg-yellow-400/20' : isUser ? 'hover:bg-slate-800/40' : ''
                    } ${isUser && gameStatus === 'selecting' ? 'cursor-pointer' : ''} transition-colors`}
                    onClick={() => isUser && gameStatus === 'selecting' && handleStatSelect(stat)}
                    title={getStatDescription(stat)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">{stat}</span>
                      {(isUser || cardsRevealed) && (
                        <span className="text-xs font-bold">{player.stats[stat]}</span>
                      )}
                    </div>
                    {(isUser || cardsRevealed) && (
                      <StatBar
                        value={player.stats[stat]}
                        highlight={highlightStat === stat}
                        max={stat === 'Strike Rate' ? 200 : stat === 'Experience' ? 250 : 100}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Rarity indicator */}
            <div className={`absolute top-2 right-2 ${getRarityColor(player.rarity)} px-2 py-1 rounded-full text-xs font-bold shadow-md`}>
              {player.rarity}
            </div>

            {/* Player image */}
            <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-xl bg-black/20">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${player.photo})`,
                  filter: 'brightness(0.85)'
                }}
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-lg font-bold truncate">{player.name}</div>
                <div className="text-xs text-blue-300">{player.team}</div>
              </div>
            </div>

            {/* Stats display */}
            <div className="space-y-2 mt-2">
              {STAT_KEYS.map(stat => (
                <div
                  key={stat}
                  className={`p-2 rounded-lg ${
                    highlightStat === stat ? 'bg-yellow-400/20' : 'hover:bg-slate-800/40'
                  } cursor-pointer transition-colors`}
                  onClick={() => gameStatus === 'selecting' && handleStatSelect(stat)}
                  title={getStatDescription(stat)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{stat}</span>
                    <span className="font-bold">{player.stats[stat]}</span>
                  </div>
                  <StatBar
                    value={player.stats[stat]}
                    highlight={highlightStat === stat}
                    max={stat === 'Strike Rate' ? 200 : stat === 'Experience' ? 250 : 100}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Show result indicator if this is an opponent card */}
        {!isUser && index >= 0 && cardsRevealed && winners[index] && (
          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            winners[index] === 'user' ? 'bg-green-500/80' :
            winners[index] === 'opponent' ? 'bg-red-500/80' :
            'bg-yellow-500/80'
          }`}>
            {winners[index] === 'user' ? 'Win' :
             winners[index] === 'opponent' ? 'Loss' :
             'Draw'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl">
      {/* Game header */}
      <div className="flex justify-between items-center mb-2 p-2 bg-slate-900/50 rounded-xl">
        <div>
          <div className="text-lg font-bold">Trump Card Battle</div>
          <div className="text-xs text-blue-300">Round {round} of {MAX_ROUNDS}</div>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-base font-bold text-emerald-400">{userStats.wins}</div>
            <div className="text-xs text-blue-300">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-red-400">{userStats.losses}</div>
            <div className="text-xs text-blue-300">Losses</div>
          </div>
        </div>
      </div>

      {/* Game content */}
      <div className="bg-slate-900/60 rounded-2xl p-4">
        {gameStatus === 'ready' ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
            <button
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
              onClick={() => startNewRound()}
            >
              Start Game
            </button>
          </div>
        ) : userPlayer ? (
          <div>
            {/* Countdown and status */}
            <div className="mb-3 text-center">
              {gameStatus === 'selecting' ? (
                <div>
                  <div className="text-base font-bold mb-1">
                    Select a stat to compete with all opponents
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(countdown / ROUND_TIME_SECONDS) * 100}%` }}
                    />
                  </div>
                </div>
              ) : gameStatus === 'revealing' ? (
                <div className="text-base font-bold animate-pulse">Revealing results...</div>
              ) : gameStatus === 'roundComplete' ? (
                <div className="mb-2">
                  {getRoundResult() === 'won' ? (
                    <div className="text-lg font-bold text-emerald-400">You won this round!</div>
                  ) : getRoundResult() === 'lost' ? (
                    <div className="text-lg font-bold text-red-400">You lost this round!</div>
                  ) : (
                    <div className="text-lg font-bold text-yellow-400">This round is a tie!</div>
                  )}
                  <div className="text-xs text-blue-300">
                    {winners.filter(w => w === 'user').length} wins, {winners.filter(w => w === 'opponent').length} losses, {winners.filter(w => w === 'draw').length} draws
                  </div>
                </div>
              ) : gameStatus === 'gameOver' ? (
                <div className="text-lg font-bold">
                  Game Over! {userStats.wins > userStats.losses ? 'You won!' : userStats.wins < userStats.losses ? 'Opponents won!' : 'It\'s a draw!'}
                </div>
              ) : null}
            </div>

            {/* Main Game Area - Flexible layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {/* User Card - Takes left side on larger screens */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-bold mb-1 text-blue-300">Your Card</h3>
                <PlayerCard
                  player={userPlayer}
                  isUser={true}
                  highlighted={gameStatus === 'selecting'}
                  compact={false}
                />

                {/* Stats explanation tooltip - only on selecting state */}
                {gameStatus === 'selecting' && (
                  <div className="mt-2 p-2 bg-slate-800/40 rounded-lg">
                    <h4 className="font-bold text-xs text-blue-300 mb-1">Cricket Stat Guide:</h4>
                    <div className="text-xs space-y-0.5">
                      {STAT_KEYS.map(stat => (
                        <div key={stat}>
                          <span className="font-semibold">{stat}:</span> {getStatDescription(stat)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Opponents Grid - Takes right side on larger screens */}
              <div className="md:col-span-3">
                <h3 className="text-sm font-bold mb-1 text-blue-300">Opponent Cards</h3>
                <div className="grid grid-cols-2 gap-2">
                  {opponentPlayers.map((player, index) => (
                    <PlayerCard
                      key={index}
                      player={player}
                      isUser={false}
                      index={index}
                      isHidden={gameStatus === 'selecting'}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {gameStatus === 'roundComplete' && (
              <div className="mt-3 text-center">
                <button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white text-sm"
                  onClick={handleNextRound}
                >
                  {round >= MAX_ROUNDS ? 'End Game' : 'Next Round'}
                </button>
              </div>
            )}

            {gameStatus === 'gameOver' && (
              <div className="mt-3 text-center">
                <button
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-white text-sm"
                  onClick={handleRestart}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-xl font-bold">Loading players...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrumpCardBattle;
