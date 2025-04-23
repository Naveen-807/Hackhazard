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
    <Card className={`bg-gray-900/80 border-gray-700 shadow-lg text-white overflow-hidden ${className}`}>
      <CardHeader 
        className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            AI Bidding Advisor
          </CardTitle>
          {recommendation && (
            <Badge 
              className={`ml-2 ${recommendation.shouldBid ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'} text-xs`}
            >
              {recommendation.shouldBid ? 'Recommends Bidding' : 'Not Recommended'}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 pt-3">
          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-sm text-gray-400">Analyzing player value and market conditions...</p>
            </div>
          ) : recommendation ? (
            <>
              {/* Recommendation summary */}
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-yellow-400" />
                    <span className="text-sm font-medium">AI Recommendation:</span>
                  </div>
                  <Badge className="bg-gray-700 text-xs">
                    {confidenceInfo.label} Confidence
                  </Badge>
                </div>
                <p className="text-sm">
                  {recommendation.shouldBid 
                    ? `You should bid ${formatCurrency(bidSteps.recommended)} for this player.` 
                    : `Bidding on this player is not recommended at this time.`
                  }
                </p>
                <div className="mt-2">
                  <div className="text-xs text-gray-400 flex justify-between mb-1">
                    <span>Confidence</span>
                    <span className={confidenceInfo.color}>{Math.round((recommendation.confidence || 0.5) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(recommendation.confidence || 0.5) * 100} 
                    className={`h-2 [&>div]:${confidenceInfo.color.replace('text-', '')}`}
                  />
                </div>
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
              
              {/* Strategic advice */}
              {recommendation.strategicAdvice && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="outline" className="bg-purple-900/30 border-purple-700/30 text-xs">
                      PRO TIP
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300">{recommendation.strategicAdvice}</p>
                </div>
              )}
              
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
                    className={`bg-${recommendation?.shouldBid ? 'green' : 'gray'}-600 hover:bg-${recommendation?.shouldBid ? 'green' : 'gray'}-700`}
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