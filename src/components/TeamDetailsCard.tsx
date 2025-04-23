import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Users, DollarSign, TrendingUp, Medal, Clock } from 'lucide-react';

interface TeamDetailsCardProps {
  team: {
    name: string;
    logo?: string;
    owner?: string;
    purse: number;
    totalPurse?: number;
    playersRequired?: number;
    playersOwned?: {
      total: number;
      batsmen: number;
      bowlers: number;
      allRounders: number;
      wicketKeepers: number;
    };
    trophies?: number;
    lastYearPosition?: number;
    captainName?: string;
    homeGround?: string;
    teamColors?: string;
    recentForm?: string;
  };
  className?: string;
}

const TeamDetailsCard: React.FC<TeamDetailsCardProps> = ({
  team,
  className = '',
}) => {
  // Calculate remaining purse percentage
  const remainingPursePercentage = team.totalPurse 
    ? Math.round((team.purse / team.totalPurse) * 100)
    : 100;

  // Helper function to render roster slots
  const renderRosterStatus = () => {
    if (!team.playersOwned || !team.playersRequired) return null;
    
    return (
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Squad Composition</span>
          <span className="text-gray-300 font-medium">{team.playersOwned.total}/{team.playersRequired}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/50 rounded-md p-2">
            <div className="text-xs text-gray-400">Batsmen</div>
            <div className="text-lg">{team.playersOwned.batsmen}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-md p-2">
            <div className="text-xs text-gray-400">Bowlers</div>
            <div className="text-lg">{team.playersOwned.bowlers}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-md p-2">
            <div className="text-xs text-gray-400">All-Rounders</div>
            <div className="text-lg">{team.playersOwned.allRounders}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-md p-2">
            <div className="text-xs text-gray-400">Wicket-Keepers</div>
            <div className="text-lg">{team.playersOwned.wicketKeepers}</div>
          </div>
        </div>
      </div>
    );
  };

  // Get badge color for form
  const getFormBadgeColor = (form: string) => {
    switch (form?.toLowerCase()) {
      case 'excellent': return 'bg-green-700/50 text-green-200';
      case 'good': return 'bg-blue-700/50 text-blue-200';
      case 'average': return 'bg-yellow-700/50 text-yellow-200';
      case 'poor': return 'bg-red-700/50 text-red-200';
      default: return 'bg-gray-700/50 text-gray-200';
    }
  };

  return (
    <Card className={`bg-gray-900/80 border-gray-800 shadow-lg overflow-hidden ${className}`}>
      <CardHeader className={`bg-gradient-to-r from-blue-900/30 to-purple-900/30 pb-3`}>
        <div className="flex items-center gap-3">
          {team.logo && (
            <div className="h-12 w-12 bg-white rounded-full p-1 flex items-center justify-center">
              <img 
                src={team.logo} 
                alt={`${team.name} logo`} 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div>
            <CardTitle className="text-xl font-bold text-white">{team.name}</CardTitle>
            <CardDescription className="text-gray-300">
              {team.owner && `Owned by ${team.owner}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Purse Information */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <DollarSign size={16} className="text-green-400 mr-1" />
              <span className="text-sm text-gray-400">Remaining Purse</span>
            </div>
            <span className="text-lg font-bold text-green-400">₹{team.purse} Cr</span>
          </div>
          
          <Progress 
            value={remainingPursePercentage} 
            className={`h-2 [&>div]:${remainingPursePercentage > 50 ? "bg-green-500" : "bg-yellow-500"}`}
          />
          
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">
              {team.totalPurse && `${team.purse} of ${team.totalPurse} Cr (${remainingPursePercentage}%)`}
            </span>
          </div>
        </div>
        
        {/* Team Roster Status */}
        {renderRosterStatus()}
        
        <Separator className="my-4 bg-gray-800" />
        
        {/* Team Metadata */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {team.trophies !== undefined && (
            <div className="flex items-center gap-2">
              <Medal size={16} className="text-yellow-500" />
              <div>
                <div className="text-gray-400">Trophies</div>
                <div className="text-white">{team.trophies}</div>
              </div>
            </div>
          )}
          
          {team.lastYearPosition !== undefined && (
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              <div>
                <div className="text-gray-400">Last Season</div>
                <div className="text-white">{getPositionText(team.lastYearPosition)}</div>
              </div>
            </div>
          )}
          
          {team.captainName && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-500" />
              <div>
                <div className="text-gray-400">Captain</div>
                <div className="text-white">{team.captainName}</div>
              </div>
            </div>
          )}
          
          {team.homeGround && (
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <div>
                <div className="text-gray-400">Home Ground</div>
                <div className="text-white">{team.homeGround}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Team Form */}
        {team.recentForm && (
          <div className="mt-4">
            <Badge className={`${getFormBadgeColor(team.recentForm)} px-2 py-1`}>
              {team.recentForm} Form
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to display position text
const getPositionText = (position: number): string => {
  if (position === 1) return "Winners";
  if (position === 2) return "Runners-up";
  if (position <= 4) return `Play-offs (${position})`;
  return `${position}${getOrdinalSuffix(position)} Place`;
};

const getOrdinalSuffix = (i: number): string => {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

export default TeamDetailsCard;