import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, ChevronRight, ChevronDown, Star } from 'lucide-react';

interface PlayerRecommendationProps {
  players?: any[];
  recommendedPlayers?: any[];
  selectedTeam?: any;
  onPlayerSelect?: (player: any) => void;
  className?: string;
  title?: string;
  loading?: boolean;
}

const PlayerRecommendationPanel: React.FC<PlayerRecommendationProps> = ({
  players = [],
  recommendedPlayers,
  selectedTeam,
  onPlayerSelect,
  className = '',
  title = 'Player Recommendations',
  loading = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Use recommendedPlayers if provided, otherwise use the players prop
  const displayPlayers = recommendedPlayers || players;

  // Filter players based on search query and active filter
  const filteredPlayers = displayPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !activeFilter || player.role.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Get a list of unique player roles for filtering
  const roles = Array.from(new Set(displayPlayers.map(player => player.role)));

  // Function to calculate match percentage based on team needs
  const getMatchPercentage = (player: any) => {
    if (!selectedTeam) return 60; // Default value if no team selected
    
    // This is a simplified example - in reality you would have more complex logic
    // based on the team's needs and player statistics
    const baseScore = Math.floor(Math.random() * 30) + 60; // Random score between 60-90
    
    // Adjust based on role - just an example
    if (selectedTeam.name === 'Mumbai Indians' && player.role === 'Bowler') {
      return Math.min(baseScore + 15, 100);
    }
    
    if (selectedTeam.name === 'Chennai Super Kings' && player.role === 'All-Rounder') {
      return Math.min(baseScore + 10, 100);
    }
    
    return baseScore;
  };

  // Color for match percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-400';
    if (percentage >= 70) return 'text-blue-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className={`bg-gray-900/80 border-gray-700 shadow-lg text-white overflow-hidden ${className}`}>
      <CardHeader 
        className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            {title}
          </CardTitle>
          {selectedTeam && (
            <Badge className="ml-2 bg-blue-900/50 text-blue-300 text-xs">
              For {selectedTeam.name}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 pt-3">
          {/* Search and filter controls */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                className="w-full bg-gray-800 border border-gray-700 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 text-gray-300"
                onClick={(e) => { 
                  e.stopPropagation();
                  setActiveFilter(null);
                }}
              >
                <Filter size={14} className="mr-1" />
                {activeFilter || 'All Roles'}
              </Button>
              {roles.length > 0 && (
                <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 w-32 overflow-hidden">
                  <div 
                    className="py-1.5 px-3 text-sm cursor-pointer hover:bg-gray-800"
                    onClick={() => setActiveFilter(null)}
                  >
                    All Roles
                  </div>
                  {roles.map((role, i) => (
                    <div 
                      key={i}
                      className="py-1.5 px-3 text-sm cursor-pointer hover:bg-gray-800"
                      onClick={() => setActiveFilter(role)}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Player list */}
              {filteredPlayers.length > 0 ? (
                <div className="space-y-2">
                  {filteredPlayers.map((player, index) => {
                    const matchPercentage = getMatchPercentage(player);
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                        onClick={() => onPlayerSelect && onPlayerSelect(player)}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-800 rounded-md flex-shrink-0 overflow-hidden border border-gray-700">
                            {player.imgUrl && (
                              <img 
                                src={player.imgUrl} 
                                alt={player.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="font-semibold text-sm">{player.name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-2">
                              <span>{player.role}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                              <span>₹{player.basePrice} Cr</span>
                            </div>
                          </div>
                        </div>
                        <div className={`font-medium ${getMatchColor(matchPercentage)}`}>
                          {matchPercentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No players found matching your criteria
                </div>
              )}
              
              {/* Team needs section */}
              {selectedTeam && (
                <>
                  <Separator className="my-4 bg-gray-800" />
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Team Needs Analysis</h3>
                    <div className="text-xs text-gray-300">
                      <p className="mb-2">
                        Based on {selectedTeam.name}'s current roster and playing style, the team would benefit most from:
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-900/30 border-blue-700/30">Top Priority</Badge>
                          <span>{selectedTeam.name === 'Mumbai Indians' ? 'Fast Bowler' : 'All-Rounder'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-900/30 border-purple-700/30">High Priority</Badge>
                          <span>{selectedTeam.name === 'Chennai Super Kings' ? 'Wicket-Keeper' : 'Spin Bowler'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-800 border-gray-700">Medium Priority</Badge>
                          <span>Middle Order Batsman</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          
          {/* See all button */}
          {filteredPlayers.length > 5 && (
            <Button 
              variant="link" 
              className="w-full mt-4 text-blue-400" 
              size="sm"
            >
              See all recommended players
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PlayerRecommendationPanel;