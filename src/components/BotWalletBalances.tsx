"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BOT_WALLETS, 
  Wallet,
  getWalletBalances, 
  executeAutomaticAITransaction,
  scheduleAutomaticPayments,
  formatAddress,
  getModeratorWallet,
  createBotPaymentContract,
  BOT_PAYMENT_CONTRACT_ABI,
  isAIWallet,
  loadBotWallets,
  BotWallet
} from '@/lib/bot-wallets';
import { MONAD_CONFIG } from '@/lib/monad-utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, Bot, Clock, Cpu } from 'lucide-react';
import { getBotModeratorFees } from '@/lib/bot-bidding-service';

// Bot payment contract address (this would normally be configured in an environment variable)
const BOT_PAYMENT_CONTRACT_ADDRESS = "0xEBE1e2A8d6E57323A4D92d56eDD6635ccA6d3980"; // Updated with actual deployed address

// Moderator address
const MODERATOR_ADDRESS = "0xDAcd7b2E80E2Bee4C5f6d5BBD683a56CE0130f46";

interface BotWalletBalancesProps {
  provider?: ethers.Provider;
  isModeratorView?: boolean;
  refreshTrigger?: number;
  showModeratorFees?: boolean;
}

const BotWalletBalances: React.FC<BotWalletBalancesProps> = ({ 
  provider, 
  isModeratorView = false,
  refreshTrigger = 0,
  showModeratorFees = true
}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [botWallets, setBotWallets] = useState<BotWallet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingTransactions, setPendingTransactions] = useState<Record<string, boolean>>({});
  const [autoPayEnabled, setAutoPayEnabled] = useState<boolean>(false);
  const [autoPayInterval, setAutoPayInterval] = useState<number>(10); // 10 minutes default
  const [autoPayAmount, setAutoPayAmount] = useState<string>('0.001'); // 0.001 MON default
  const [autoPayIntervalId, setAutoPayIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [totalModeratorFees, setTotalModeratorFees] = useState<number>(0);
  const { toast } = useToast();
  const isUserView = !isModeratorView;

  // Refresh wallet balances
  const refreshBalances = async () => {
    if (!provider) return;

    setIsRefreshing(true);
    try {
      const updatedWallets = await getWalletBalances(provider);
      setWallets(updatedWallets);
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
      toast({
        title: "Error",
        description: "Failed to refresh wallet balances",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize and load wallet balances
  useEffect(() => {
    const loadBalances = async () => {
      if (!provider) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const initialWallets = await getWalletBalances(provider);
        setWallets(initialWallets);
      } catch (error) {
        console.error("Error loading wallet balances:", error);
        toast({
          title: "Error",
          description: "Failed to load wallet balances",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBalances();
    
    // Set up balance refresh interval
    const intervalId = setInterval(refreshBalances, 60000); // Every minute
    
    return () => {
      clearInterval(intervalId);
      // Clear auto-pay interval if active
      if (autoPayIntervalId) {
        clearInterval(autoPayIntervalId);
      }
    };
  }, [provider]);

  // Load bot wallets and calculate moderator fees
  useEffect(() => {
    const loadWallets = async () => {
      setIsLoading(true);
      try {
        const wallets = await loadBotWallets();
        setBotWallets(wallets);

        // Calculate total fees paid to moderator if enabled
        if (showModeratorFees && typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          
          let totalFees = 0;
          for (const wallet of wallets) {
            try {
              const fees = await getBotModeratorFees(provider, wallet.address);
              totalFees += fees;
            } catch (error) {
              console.error(`Error fetching fees for ${wallet.name}:`, error);
            }
          }
          
          setTotalModeratorFees(totalFees);
        }
      } catch (error) {
        console.error("Error loading bot wallets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, [refreshTrigger, showModeratorFees]);

  // Execute automatic bot payment to moderator
  const handleAIBotPayment = async (teamId: string, amount: string) => {
    if (!provider) return;
    
    setPendingTransactions(prev => ({ ...prev, [teamId]: true }));
    
    try {
      const moderatorWallet = getModeratorWallet();
      const result = await executeAutomaticAITransaction(
        provider, 
        teamId, 
        moderatorWallet.address, 
        amount
      );
      
      if (result.success) {
        toast({
          title: "AI Payment Success",
          description: `AI Bot automatically paid ${amount} ${MONAD_CONFIG.nativeCurrency.symbol} to AI Moderator.`,
          variant: "default",
        });
        
        // Refresh balances after transaction
        await refreshBalances();
      } else {
        toast({
          title: "AI Payment Failed",
          description: result.error || "Transaction failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to execute AI bot payment",
        variant: "destructive",
      });
    } finally {
      setPendingTransactions(prev => ({ ...prev, [teamId]: false }));
    }
  };
  
  // Use smart contract to process payment
  const handleContractPayment = async (teamId: string, amount: string) => {
    if (!provider) return;
    
    setPendingTransactions(prev => ({ ...prev, [teamId]: true }));
    
    try {
      const wallet = wallets.find(w => w.type === 'team' && w.teamId === teamId);
      
      if (!wallet || !wallet.privateKey) {
        throw new Error("Team wallet not found or private key missing");
      }
      
      if (!wallet.isAI) {
        throw new Error("Only AI-controlled wallets can make automatic payments");
      }
      
      // Create signer for the team wallet
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      // Create contract instance with team wallet as signer
      const contract = createBotPaymentContract(
        provider,
        BOT_PAYMENT_CONTRACT_ADDRESS,
        signer
      );
      
      // Calculate amount in wei
      const amountWei = ethers.parseEther(amount);
      
      // Call the contract's payModerator function
      const tx = await contract.payModerator({ value: amountWei });
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      toast({
        title: "AI Smart Contract Payment Success",
        description: `AI Bot automatically paid ${amount} ${MONAD_CONFIG.nativeCurrency.symbol} to AI Moderator via smart contract.`,
        variant: "default",
      });
      
      // Refresh balances after transaction
      await refreshBalances();
    } catch (error: any) {
      console.error("Error executing contract payment:", error);
      toast({
        title: "AI Contract Payment Failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setPendingTransactions(prev => ({ ...prev, [teamId]: false }));
    }
  };

  // Toggle automatic payment schedule
  const toggleAutomaticPayments = () => {
    if (!provider) {
      toast({
        title: "Error",
        description: "Provider is not available",
        variant: "destructive",
      });
      return;
    }

    if (autoPayEnabled) {
      // Disable automatic payments
      if (autoPayIntervalId) {
        clearInterval(autoPayIntervalId);
        setAutoPayIntervalId(null);
      }
      
      setAutoPayEnabled(false);
      toast({
        title: "Automatic Payments Disabled",
        description: "AI bots will no longer automatically pay the AI moderator",
        variant: "default",
      });
    } else {
      // Enable automatic payments
      const teamIds = wallets
        .filter(wallet => wallet.type === 'team' && wallet.isAI)
        .map(wallet => wallet.teamId!)
        .filter(Boolean);
      
      if (teamIds.length === 0) {
        toast({
          title: "Error",
          description: "No AI team wallets found",
          variant: "destructive",
        });
        return;
      }
      
      const intervalId = scheduleAutomaticPayments(
        provider,
        teamIds,
        autoPayAmount,
        autoPayInterval
      );
      
      setAutoPayIntervalId(intervalId);
      setAutoPayEnabled(true);
      
      toast({
        title: "Automatic Payments Enabled",
        description: `AI bots will automatically pay ${autoPayAmount} ${MONAD_CONFIG.nativeCurrency.symbol} to the AI moderator every ${autoPayInterval} minutes`,
        variant: "default",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p>Loading wallet balances...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          AI Bot Wallet Balances
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={refreshBalances}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Auto-payment scheduling controls */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
        <h3 className="text-md font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          AI Automatic Payment Schedule
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Amount:</span>
            <input
              type="number"
              value={autoPayAmount}
              onChange={(e) => setAutoPayAmount(e.target.value)}
              disabled={autoPayEnabled}
              className="w-24 px-2 py-1 text-sm border rounded"
              step="0.0001"
              min="0.0001"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Every:</span>
            <input
              type="number"
              value={autoPayInterval}
              onChange={(e) => setAutoPayInterval(parseInt(e.target.value) || 10)}
              disabled={autoPayEnabled}
              className="w-16 px-2 py-1 text-sm border rounded"
              min="1"
              step="1"
            />
            <span className="text-sm">minutes</span>
          </div>
          <Button
            size="sm"
            variant={autoPayEnabled ? "destructive" : "default"}
            onClick={toggleAutomaticPayments}
            className="ml-auto"
          >
            {autoPayEnabled ? "Disable Auto-Pay" : "Enable Auto-Pay"}
          </Button>
        </div>
        {autoPayEnabled && (
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
            AI bots will automatically pay the AI moderator every {autoPayInterval} minutes
          </p>
        )}
      </div>

      <Tabs defaultValue="bots">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="bots">AI Bot Teams</TabsTrigger>
          <TabsTrigger value="system">System Wallets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bots" className="space-y-4">
          {wallets
            .filter(wallet => wallet.type === 'team' && wallet.isAI)
            .map(wallet => (
              <div
                key={wallet.address}
                className="flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex flex-col mb-2 md:mb-0">
                  <span className="font-medium text-lg flex items-center gap-1">
                    {wallet.name}
                    <Bot className="h-4 w-4 ml-1" />
                  </span>
                  <span className="text-gray-500 text-sm">{formatAddress(wallet.address)}</span>
                  <Badge variant="outline" className="mt-1 w-fit">
                    {wallet.balance || '0.0000'} {MONAD_CONFIG.nativeCurrency.symbol}
                  </Badge>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAIBotPayment(wallet.teamId!, '0.001')}
                    disabled={pendingTransactions[wallet.teamId!] || !wallet.balance || parseFloat(wallet.balance) <= 0.001}
                    className="w-full md:w-auto"
                  >
                    {pendingTransactions[wallet.teamId!] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    AI Pay 0.001 {MONAD_CONFIG.nativeCurrency.symbol}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleContractPayment(wallet.teamId!, '0.001')}
                    disabled={pendingTransactions[wallet.teamId!] || !wallet.balance || parseFloat(wallet.balance) <= 0.001}
                    className="w-full md:w-auto"
                  >
                    {pendingTransactions[wallet.teamId!] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    AI Smart Contract Payment
                  </Button>
                </div>
              </div>
            ))}
          
          {wallets.filter(wallet => wallet.type === 'team' && wallet.isAI).length === 0 && (
            <div className="flex items-center justify-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <p>No AI team wallets available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="system" className="space-y-3">
          {wallets
            .filter(wallet => wallet.type !== 'team')
            .map(wallet => (
              <div
                key={wallet.address}
                className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-lg flex items-center gap-1">
                    {wallet.name}
                    {wallet.isAI && <Bot className="h-4 w-4 ml-1" />}
                  </span>
                  <span className="text-gray-500 text-sm">{formatAddress(wallet.address)}</span>
                  <Badge 
                    variant={wallet.type === 'moderator' ? 'default' : 'secondary'} 
                    className="mt-1 w-fit"
                  >
                    {wallet.balance || '0.0000'} {MONAD_CONFIG.nativeCurrency.symbol}
                  </Badge>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="outline">{wallet.type}</Badge>
                  {wallet.isAI && (
                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      <Bot className="h-3 w-3 mr-1" /> AI-controlled
                    </Badge>
                  )}
                </div>
              </div>
            ))}
        </TabsContent>
      </Tabs>

      {showModeratorFees && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">Total Moderator Fees</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paid to: {MODERATOR_ADDRESS.substring(0, 6)}...{MODERATOR_ADDRESS.substring(MODERATOR_ADDRESS.length - 4)}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              {totalModeratorFees.toFixed(4)} MONAD
            </div>
          </div>
        </div>
      )}

      {isUserView && (
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md text-yellow-800 dark:text-yellow-300 text-sm">
          <p className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>
              Note: You are viewing AI-controlled wallets. All team wallets and the moderator wallet are controlled by AI. 
              You can view balances and trigger AI actions, but cannot directly control these wallets.
            </span>
          </p>
        </div>
      )}
    </Card>
  );
};

export default BotWalletBalances;