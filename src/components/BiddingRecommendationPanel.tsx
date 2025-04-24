import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, ChevronDown, Brain, Lightbulb, AlertTriangle } from 'lucide-react';

interface BiddingRecommendationPanelProps {
  player?: any;
  currentBid: number;
  walletBalance: number;
  onPlaceBid: (amount: number) => void;
  recommendation?: {
    shouldBid: boolean;
    recommendedBidAmount?: number;
    reasoning?: string;
    playerValueAssessment?: string;
    strategicAdvice?: string;
    confidence?: number;
  };
  isLoading?: boolean;
  className?: string;
  currencySymbol?: string;
}

const BiddingRecommendationPanel: React.FC<BiddingRecommendationPanelProps> = ({
  player,
  currentBid,
  walletBalance,
  onPlaceBid,
  recommendation,
  isLoading = false,
  className = '',
  currencySymbol = '₹'
}) => {
  const [expanded, setExpanded] = useState(true);
  const [bidAmount, setBidAmount] = useState(currentBid > 0 ? Math.ceil(currentBid * 1.1) : 1);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Get confidence level color and label
  const getConfidenceInfo = (confidence: number = 0.5) => {
    if (confidence >= 0.85) return { color: 'text-green-500', label: 'Very High' };
    if (confidence >= 0.7) return { color: 'text-blue-500', label: 'High' };
    if (confidence >= 0.5) return { color: 'text-yellow-500', label: 'Moderate' };
    return { color: 'text-red-500', label: 'Low' };
  };
  
  const confidenceInfo = getConfidenceInfo(recommendation?.confidence);

  // Calculate recommended bid steps
  const getBidSteps = () => {
    const minBid = currentBid > 0 ? Math.ceil(currentBid * 1.05) : 1;
    const normalBid = currentBid > 0 ? Math.ceil(currentBid * 1.1) : 2;
    const aggressiveBid = currentBid > 0 ? Math.ceil(currentBid * 1.2) : 3;
    
    return {
      min: Math.min(minBid, walletBalance),
      normal: Math.min(normalBid, walletBalance),
      aggressive: Math.min(aggressiveBid, walletBalance),
      recommended: recommendation?.recommendedBidAmount 
        ? Math.min(recommendation.recommendedBidAmount, walletBalance)
        : Math.min(normalBid, walletBalance)
    };
  };
  
  const bidSteps = getBidSteps();

  return (
    <Card className={`bg-gradient-to-br from-gray-900/90 to-slate-900/90 border-blue-900/40 shadow-2xl text-white overflow-hidden ${className}`}>
      <CardHeader 
        className="bg-gradient-to-b from-blue-950 to-gray-900 p-4 cursor-pointer flex flex-row items-center justify-between border-b border-blue-900/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/ai-avatar.png"
              alt="AI"
              className="w-7 h-7 rounded-full border-2 border-purple-500 shadow bg-slate-800 object-cover"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://ui-avatars.com/api/?name=AI&background=6c47ff&color=fff&bold=true';
              }}
            />
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-300 drop-shadow">
              <Brain size={18} className="text-purple-400" />
              AI Insight
            </CardTitle>
          </div>
          {recommendation && (
            <Badge 
              className={`ml-2 ${recommendation.shouldBid ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'} text-xs`}
            >
              {recommendation.shouldBid ? 'Recommended' : 'Not Recommended'}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </CardHeader>
      {expanded && (
        <CardContent className="p-5 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-sm text-gray-400">Analyzing player value, market trends, and team fit...</p>
            </div>
          ) : recommendation ? (
            <>
              {/* AI Persona Message */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-blue-300 font-semibold">CoachAI:</span>
                <span className="text-sm text-blue-100 italic">{recommendation.shouldBid
                  ? `This player could be a game-changer for your team!`
                  : `I'd suggest holding your budget for a better fit.`}
                </span>
              </div>
              {/* Market Trend & Player Fit */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 bg-slate-800/60 rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb size={14} className="text-yellow-400" />
                    <span className="text-sm font-medium">AI Recommendation</span>
                  </div>
                  <span className="text-xs text-gray-300">{recommendation.shouldBid
                    ? `Bid ${formatCurrency(bidSteps.recommended)} for a strong chance to win.`
                    : `Not recommended to bid at this time.`}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-gray-700 text-xs">{confidenceInfo.label} Confidence</Badge>
                    <span className={confidenceInfo.color + ' text-xs'}>{Math.round((recommendation.confidence || 0.5) * 100)}%</span>
                  </div>
                  <Progress value={(recommendation.confidence || 0.5) * 100} className={`h-2 mt-1 [&>div]:${confidenceInfo.color.replace('text-', '')}`} />
                </div>
                <div className="flex-1 bg-slate-800/60 rounded-lg p-3 flex flex-col gap-1">
                  <span className="text-xs text-blue-300 font-semibold mb-1">Player Fit</span>
                  <span className="text-xs text-gray-300">{player?.role ? `Best for: ${player.role}` : 'No specific fit data.'}</span>
                  <span className="text-xs text-gray-400 mt-1">Team need: <span className="text-white font-semibold">{recommendation?.strategicAdvice || 'Balanced'}</span></span>
                </div>
              </div>
              {/* Market Trend (placeholder) */}
              <div className="mb-4">
                <span className="text-xs text-amber-300 font-semibold">Market Trend:</span>
                <span className="text-xs text-gray-300 ml-2">This player’s price has {recommendation.shouldBid ? 'risen' : 'remained stable'} in recent rounds.</span>
              </div>
              {/* Player value assessment */}
              {recommendation.playerValueAssessment && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-blue-400 mb-2">Player Value Assessment</h3>
                  <p className="text-xs text-gray-300">{recommendation.playerValueAssessment}</p>
                </div>
              )}
              {/* Strategic reasoning */}
              {recommendation.reasoning && (
                <>
                  <Separator className="my-3 bg-gray-800" />
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Strategic Analysis</h3>
                    <p className="text-xs text-gray-300">{recommendation.reasoning}</p>
                  </div>
                </>
              )}
              {/* Pro Tip */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="outline" className="bg-purple-900/30 border-purple-700/30 text-xs animate-pulse">
                    PRO TIP
                  </Badge>
                  <span className="text-xs text-purple-300">Bidding slightly above the recommendation can help you outpace bots!</span>
                </div>
              </div>
              {/* Quick bid options */}
              <Separator className="my-3 bg-gray-800" />
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Quick Bid Options</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => onPlaceBid(bidSteps.min)}
                  >
                    {formatCurrency(bidSteps.min)}
                    <span className="text-xs text-gray-400 ml-1">Min</span>
                  </Button>
                  <Button 
                    size="sm" 
                    className={recommendation?.shouldBid
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'}
                    onClick={() => onPlaceBid(bidSteps.recommended)}
                  >
                    {formatCurrency(bidSteps.recommended)}
                    <span className="text-xs opacity-80 ml-1">Rec</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-700/50 text-amber-400 hover:bg-amber-900/20"
                    onClick={() => onPlaceBid(bidSteps.aggressive)}
                  >
                    {formatCurrency(bidSteps.aggressive)}
                    <span className="text-xs text-amber-300/70 ml-1">Aggr</span>
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Custom Bid Amount</span>
                      {bidAmount > walletBalance && (
                        <AlertTriangle size={12} className="text-red-400" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Balance: {formatCurrency(walletBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={currentBid + 0.1}
                      step={0.1}
                    />
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => onPlaceBid(bidAmount)}
                      disabled={bidAmount <= currentBid || bidAmount > walletBalance}
                    >
                      Bid Now
                    </Button>
                  </div>
                  {bidAmount <= currentBid && (
                    <p className="text-xs text-red-400 mt-1">
                      Bid must be higher than current bid ({formatCurrency(currentBid)})
                    </p>
                  )}
                  {bidAmount > walletBalance && (
                    <p className="text-xs text-red-400 mt-1">
                      Insufficient funds for this bid amount
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No recommendations available yet</p>
              <p className="text-xs mt-2">Connect your wallet and select a team to get AI recommendations</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BiddingRecommendationPanel;