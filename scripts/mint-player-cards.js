const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployed contract
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  
  // Update with the actual deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }
  
  const iplPlayerCard = await IPLPlayerCard.attach(contractAddress);
  
  console.log(`Connected to IPLPlayerCard at ${contractAddress}`);

  // Get the deployer/owner account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Check contract owner
  const owner = await iplPlayerCard.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("Deployer is not the contract owner. Only the owner can mint tokens.");
    process.exit(1);
  }

  // Read player metadata files
  const metadataDir = path.join(__dirname, "../player-metadata");
  const metadataFiles = fs.readdirSync(metadataDir).filter(file => file.startsWith("player") && file.endsWith(".json"));

  console.log(`Found ${metadataFiles.length} player metadata files`);

  // Option 1: Individual minting (with full player data)
  for (const file of metadataFiles) {
    try {
      const metadata = JSON.parse(fs.readFileSync(path.join(metadataDir, file)));
      
      // Extract attributes from metadata
      const getAttributeValue = (traitType) => {
        const attr = metadata.attributes.find(a => a.trait_type === traitType);
        return attr ? attr.value : "";
      };

      console.log(`Minting NFT for ${metadata.name}...`);

      // Upload metadata to IPFS - in a real scenario, you would upload to IPFS here
      // For this example, we'll use a mock IPFS URI
      const mockIpfsUri = `ipfs://QmZEBC4KCW95uUVBSarLpZnHQNXS6JVzuhMWGzJZ5JbGKm/${file.replace('.json', '')}`;
      
      // Create the PlayerInfo struct object
      const playerInfo = {
        name: metadata.name,
        description: metadata.description,
        role: getAttributeValue("Role"),
        nationality: getAttributeValue("Nationality"),
        age: getAttributeValue("Age") || 0,
        previousTeam: getAttributeValue("Previous Team"),
        rarity: getAttributeValue("Rarity"),
        matches: getAttributeValue("Matches") || 0,
        runs: getAttributeValue("Runs") || 0,
        battingAverage: getAttributeValue("Batting Average") || 0,
        strikeRate: getAttributeValue("Strike Rate") || 0,
        specialty: getAttributeValue("Specialty"),
        externalUrl: metadata.external_url || ""
      };
      
      // Mint the player NFT with all metadata
      const tx = await iplPlayerCard.mintPlayerCard(
        deployer.address,
        mockIpfsUri,
        playerInfo
      );

      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Successfully minted NFT for ${metadata.name}`);
    } catch (error) {
      console.error(`Error minting NFT from ${file}:`, error);
    }
  }

  // Option 2: Batch minting (just with tokenURIs)
  // This option is more gas efficient but doesn't store player data on-chain
  /*
  const batchSize = 10;
  const tokenURIs = [];
  
  for (const file of metadataFiles) {
    // Create mock IPFS URI for each player
    const mockIpfsUri = `ipfs://QmZEBC4KCW95uUVBSarLpZnHQNXS6JVzuhMWGzJZ5JbGKm/${file.replace('.json', '')}`;
    tokenURIs.push(mockIpfsUri);
    
    // If we've reached our batch size or this is the last file, mint them
    if (tokenURIs.length >= batchSize || file === metadataFiles[metadataFiles.length - 1]) {
      try {
        console.log(`Batch minting ${tokenURIs.length} NFTs...`);
        const tx = await iplPlayerCard.batchMintPlayerCards(deployer.address, tokenURIs);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log(`Successfully minted ${tokenURIs.length} NFTs`);
        
        // Clear the array for the next batch
        tokenURIs.length = 0;
      } catch (error) {
        console.error("Error batch minting NFTs:", error);
      }
    }
  }
  */

  console.log("Minting complete! ✅");

  // Get total NFTs minted
  const totalSupply = await iplPlayerCard._tokenIdCounter();
  console.log(`Total NFTs minted: ${totalSupply}`);
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });