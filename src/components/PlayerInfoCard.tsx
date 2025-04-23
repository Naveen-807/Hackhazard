import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

interface PlayerInfoCardProps {
  player: any;
  showDetailedStats?: boolean;
  className?: string;
}

const PlayerInfoCard: React.FC<PlayerInfoCardProps> = ({
  player,
  showDetailedStats = false,
  className = '',
}) => {
  // Helper function to render a stat bar
  const renderStatBar = (label: string, value: number, maxValue: number = 100) => {
    const percentage = (value / maxValue) * 100;
    let progressClass = '';
    
    if (percentage > 80) progressClass = 'bg-green-500';
    else if (percentage > 60) progressClass = 'bg-blue-500';
    else if (percentage > 40) progressClass = 'bg-yellow-500';
    else progressClass = 'bg-red-500';
    
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <Progress value={percentage} className={`h-2 [&>div]:${progressClass}`} />
      </div>
    );
  };

  // Helper function to get role color
  const getRoleColor = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'batsman': return 'bg-blue-600/50 text-blue-200';
      case 'bowler': return 'bg-red-600/50 text-red-200';
      case 'all-rounder': return 'bg-purple-600/50 text-purple-200';
      case 'wicketkeeper': return 'bg-green-600/50 text-green-200';
      case 'wicketkeeper-batsman': return 'bg-green-600/50 text-green-200';
      default: return 'bg-gray-600/50 text-gray-200';
    }
  };
  
  // Helper function to format stats based on player role
  const getKeyStats = (player: any) => {
    switch(player.role?.toLowerCase()) {
      case 'batsman':
        return [
          { label: 'Batting Average', value: player.battingAvg || player.stats?.battingAverage || '-' },
          { label: 'Strike Rate', value: player.strikeRate || player.stats?.strikeRate || '-' },
          { label: 'Highest Score', value: player.highestScore || player.stats?.highestScore || '-' },
        ];
      case 'bowler':
        return [
          { label: 'Bowling Economy', value: player.economy || player.stats?.economyRate || '-' },
          { label: 'Wickets', value: player.wickets || player.stats?.totalWickets || '-' },
          { label: 'Best Figures', value: player.bestFigures || player.stats?.bestBowlingFigures || '-' },
        ];
      case 'all-rounder':
      case 'wicketkeeper':
      case 'wicketkeeper-batsman':
      default:
        return [
          { label: 'Batting Avg', value: player.battingAvg || player.stats?.battingAverage || '-' },
          { label: 'Bowling Eco', value: player.economy || player.stats?.economyRate || '-' },
          { label: 'Matches', value: player.matches || player.stats?.matchesPlayed || '-' },
        ];
    }
  };

  // Special skill badges based on player attributes
  const getSpecialSkills = (player: any) => {
    const skills = [];
    const battingAvg = player.battingAvg || player.stats?.battingAverage;
    const economy = player.economy || player.stats?.economyRate;
    const matches = player.matches || player.stats?.matchesPlayed;
    
    if (battingAvg > 40) skills.push({ name: 'Elite Batter', icon: <TrendingUp size={14} /> });
    if (economy && economy < 7.5) skills.push({ name: 'Economy Bowler', icon: <TrendingDown size={14} /> });
    if (matches > 100) skills.push({ name: 'Experienced', icon: <CheckCircle size={14} /> });
    if (player.leadership) skills.push({ name: 'Leader', icon: <CheckCircle size={14} /> });
    if (player.form === 'Excellent') skills.push({ name: 'In Form', icon: <TrendingUp size={14} /> });
    
    return skills;
  };

  // Get player image URL (handle both image and imageUrl properties)
  const getPlayerImageUrl = () => {
    // Try local image first
    const localUrl = `/assets/players/${player.playerId}.png`;
    // Check if the file exists by attempting to load it (browser will fallback to onError)
    return localUrl;
  };

  return (
    <Card className={`bg-gray-900/80 border-gray-800 shadow-lg overflow-hidden ${className}`}>
      {/* Add the player image container */}
      <div className="player-image-container">
        <img 
          src={getPlayerImageUrl()}
          alt={player.name || 'Player'} 
          className="player-image"
          onError={(e) => {
            // Fallback to remote IPL image if local fails
            if (player.imageUrl && player.imageUrl.startsWith('http')) {
              e.currentTarget.onerror = null;
              e.currentTarget.src = player.imageUrl;
            } else {
              // Fallback to placeholder avatar
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || 'Player')}&background=1d2671&color=fff`;
            }
          }}
        />
      </div>

      <CardHeader className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-white">{player.name || 'Player Name'}</CardTitle>
            <CardDescription className="text-gray-300">
              {player.nationality || player.country || 'Country'} | {player.age || '00'} yrs
            </CardDescription>
          </div>
          <Badge className={`${getRoleColor(player.role)}`}>
            {player.role || 'Role'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          {getKeyStats(player).map((stat, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-md p-2">
              <div className="text-sm text-gray-400">{stat.label}</div>
              <div className="font-bold text-lg">{stat.value}</div>
            </div>
          ))}
        </div>
        
        {/* Special Skills */}
        {getSpecialSkills(player).length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">Special Skills</div>
            <div className="flex flex-wrap gap-2">
              {getSpecialSkills(player).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1 text-xs bg-gray-800/50 border-gray-700">
                  {skill.icon}
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Base Price */}
        <div className="bg-gray-800/50 rounded-md p-2 mb-4">
          <div className="text-xs text-gray-400 mb-1">Base Price</div>
          <div className="font-bold text-lg text-green-400">₹{player.basePrice || 0} Cr</div>
        </div>
        
        {/* Detailed Stats (if enabled) */}
        {showDetailedStats && (
          <>
            <Separator className="my-4 bg-gray-800" />
            
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="bg-gray-900">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="mt-4 space-y-3">
                {renderStatBar('Batting', player.battingRating || 50)}
                {renderStatBar('Bowling', player.bowlingRating || 30)}
                {renderStatBar('Fielding', player.fieldingRating || 60)}
                {renderStatBar('Experience', player.experienceRating || 70)}
                {renderStatBar('Form', player.formRating || 80)}
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Previous Team</span>
                    <span className="font-medium text-gray-300">{player.previousTeam || player.team || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IPL Matches</span>
                    <span className="font-medium text-gray-300">{player.matches || player.stats?.matchesPlayed || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IPL Runs</span>
                    <span className="font-medium text-gray-300">{player.runs || player.stats?.totalRuns || player.stats?.runs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IPL Wickets</span>
                    <span className="font-medium text-gray-300">{player.wickets || player.stats?.totalWickets || player.stats?.wickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Season</span>
                    <span className="font-medium text-gray-300">{player.lastSeason || 'N/A'}</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-4">
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <BarChart2 size={16} className="text-blue-400 mt-0.5" />
                    <p>{player.analysis || "This player has been performing consistently in recent tournaments. Known for ability to handle pressure situations."}</p>
                  </div>
                  
                  <div className="flex items-start gap-2 mt-2">
                    {player.form === 'Excellent' ? (
                      <TrendingUp size={16} className="text-green-400 mt-0.5" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400 mt-0.5" />
                    )}
                    <p>{player.formAnalysis || `Current form is ${player.form || 'average'}. Performance in recent matches has been noteworthy.`}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerInfoCard;