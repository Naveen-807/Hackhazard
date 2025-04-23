# IPL Player Card NFT Contract

This is an ERC-721 smart contract for creating IPL player card NFTs on the Monad testnet.

## Features

- Mint NFTs representing IPL players (e.g., Virat Kohli, MS Dhoni)
- Store detailed player metadata on-chain
- Fetch metadata from IPFS
- Owner-only minting permissions
- Player data retrieval functionality
- Batch minting support for efficiency

## Contract Structure

The `IPLPlayerCard` contract inherits from OpenZeppelin's:
- `ERC721URIStorage`: For managing token URIs
- `Ownable`: For access control

## Metadata Structure

Player metadata includes:
- Name
- Description
- Role (Batsman, Bowler, etc.)
- Nationality
- Age
- Previous Team
- Rarity (Epic, Rare, etc.)
- Match statistics (matches, runs, batting average, strike rate)
- Specialty
- External URL

## Deployment to Monad Testnet

1. Set up your environment variables:
   ```bash
   export PRIVATE_KEY=your_private_key_here
   ```

2. Deploy the contract to Monad testnet:
   ```bash
   npx hardhat run scripts/deploy-ipl-player-card.js --network monadTestnet
   ```

3. Copy the deployed contract address:
   ```bash
   export CONTRACT_ADDRESS=your_deployed_contract_address
   ```

4. Mint player NFTs:
   ```bash
   npx hardhat run scripts/mint-player-cards.js --network monadTestnet
   ```

## Contract Functions

### mintPlayerCard

Mints a new player NFT with detailed player information.

```solidity
function mintPlayerCard(
    address to,
    string memory tokenURI,
    PlayerInfo memory playerData
) public onlyOwner returns (uint256)
```

### getPlayerInfo

Retrieves player information for a specific token ID.

```solidity
function getPlayerInfo(uint256 tokenId) public view returns (PlayerInfo memory)
```

### batchMintPlayerCards

Mints multiple player NFTs in a batch for gas efficiency.

```solidity
function batchMintPlayerCards(
    address to, 
    string[] memory tokenURIs
) public onlyOwner returns (uint256[] memory)
```

## Integration with Frontend

To integrate with the frontend, use the following steps:

1. Import the contract ABI from `artifacts/contracts/IPLPlayerCard.sol/IPLPlayerCard.json`
2. Connect to the contract using ethers.js
3. Call contract functions as needed