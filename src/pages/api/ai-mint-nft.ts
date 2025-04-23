import { NextApiRequest, NextApiResponse } from 'next';
import { mintPlayerNFT } from '../../lib/nft-contract';
import type { AuctionPlayerInfo } from '../../types/player';
import { BOT_WALLETS } from '../../lib/bot-wallets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract payload from request body
    const { 
      botId, 
      playerDetails,
      auctionId,
      winningBid,
      apiKey 
    } = req.body;

    // Validate required fields
    if (!botId || !playerDetails || !auctionId || !apiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Validate API key (in production, use a secure API key verification)
    const validApiKey = process.env.AI_API_KEY || 'test-api-key';
    if (apiKey !== validApiKey) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API key' 
      });
    }

    // Get the bot's wallet address from BOT_WALLETS array
    const botWallet = BOT_WALLETS.find((wallet: any) => wallet.botId === botId);
    if (!botWallet || !botWallet.address) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bot ID or no wallet found for this bot'
      });
    }

    console.log(`Processing NFT minting for Bot ${botId} for player: ${playerDetails.name}`);

    // Mint the NFT for the bot
    const mintResult = await mintPlayerNFT(
      botWallet.address,
      playerDetails as AuctionPlayerInfo
    );

    if (!mintResult.success) {
      return res.status(500).json({
        success: false,
        error: mintResult.error || 'Failed to mint NFT'
      });
    }

    // Return success response with NFT details
    return res.status(200).json({
      success: true,
      tokenId: mintResult.tokenId,
      txHash: mintResult.txHash,
      botId,
      playerName: playerDetails.name,
      walletAddress: botWallet.address
    });

  } catch (error) {
    console.error('Error in AI NFT minting API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
