import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MONAD_CONFIG } from "@/lib/monad-utils";
import { connectWallet } from "@/lib/monad-utils";
import { AlertCircle } from 'lucide-react';

interface WalletConnectorProps {
  onWalletConnected: (address: string, balance: number, provider: ethers.BrowserProvider) => void;
  isConnected?: boolean;
  walletAddress?: string | null;
  walletBalance?: number;
  buttonClassName?: string;
  showBalance?: boolean;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
  onWalletConnected,
  isConnected = false,
  walletAddress = null,
  walletBalance = 0,
  buttonClassName = '',
  showBalance = true
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if MetaMask is installed when component mounts
    const checkMetaMaskInstalled = () => {
      const installed = typeof window !== 'undefined' && window.ethereum !== undefined;
      setIsMetaMaskInstalled(installed);
      
      if (!installed) {
        console.log("MetaMask is not installed");
      }
    };
    
    checkMetaMaskInstalled();
  }, []);

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const connectWalletWithFeedback = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!isMetaMaskInstalled) {
        setError("MetaMask not detected. Please install MetaMask to connect your wallet.");
        setIsConnecting(false);
        return;
      }
      
      const result = await connectWallet();
      
      if (!result.success) {
        setError(result.error || "Failed to connect wallet");
        return;
      }
      
      if (!result.provider || !result.address) {
        setError("Failed to get wallet provider or address");
        return;
      }
      
      // Get balance
      const balanceWei = await result.provider.getBalance(result.address);
      const formattedBalance = parseFloat(ethers.formatEther(balanceWei));
      
      // Create a proper BrowserProvider from window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      onWalletConnected(result.address, formattedBalance, provider);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleButtonClick = () => {
    if (isConnected && walletAddress) {
      setShowWalletInfo(true);
    } else {
      connectWalletWithFeedback();
    }
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={`relative ${isConnected ? 'bg-green-600 hover:bg-green-700' : buttonClassName}`}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
            Connecting...
          </>
        ) : isConnected ? (
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-300 mr-2 animate-pulse"></div>
            <span className="font-mono">{formatAddress(walletAddress)}</span>
            {showBalance && walletBalance !== undefined && (
              <Badge className="ml-2 bg-green-700 text-white">{walletBalance.toFixed(4)} {MONAD_CONFIG.nativeCurrency.symbol}</Badge>
            )}
          </div>
        ) : (
          <>
            {!isMetaMaskInstalled && <AlertCircle size={16} className="mr-1 text-amber-400" />}
            {isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
          </>
        )}
      </Button>
      
      {/* Wallet Details Dialog */}
      <Dialog open={showWalletInfo} onOpenChange={setShowWalletInfo}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Wallet Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your connected wallet information
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Address</div>
              <div className="bg-gray-800 p-3 rounded-md font-mono text-blue-300 break-all">
                {walletAddress}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Balance</div>
              <div className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                <span className="text-green-400 font-bold text-xl">
                  {walletBalance?.toFixed(5)} {MONAD_CONFIG.nativeCurrency.symbol}
                </span>
                <Badge variant="outline" className="border-green-700 text-green-400">
                  ~${(walletBalance || 0 * 2500).toFixed(2)} USD
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Connected to {MONAD_CONFIG.chainName}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWalletInfo(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(walletAddress || '');
                setShowWalletInfo(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Copy Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-400">Connection Error</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-900/30 border border-red-900 rounded-md p-4 text-red-200">
              {error}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Please ensure that:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>MetaMask or another Web3 wallet is installed</li>
                <li>Your wallet is unlocked</li>
                <li>You have granted permission to this site</li>
                {!isMetaMaskInstalled && (
                  <li className="text-amber-400">
                    <a 
                      href="https://metamask.io/download/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-amber-300"
                    >
                      Click here to install MetaMask
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setError(null)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
            {isMetaMaskInstalled && (
              <Button 
                onClick={connectWalletWithFeedback}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletConnector;