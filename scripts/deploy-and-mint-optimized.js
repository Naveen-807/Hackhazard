const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying gas-optimized IPLPlayerCard contract...");

  // Get the contract factory
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  
  // Deploy the contract
  const iplPlayerCard = await IPLPlayerCard.deploy();
  
  // Get deployment info
  const deploymentTx = iplPlayerCard.deploymentTransaction();
  
  console.log(`IPLPlayerCard deployed to: ${iplPlayerCard.target}`);
  console.log("Deployment transaction hash:", deploymentTx?.hash);

  // Wait for block confirmations
  console.log("Waiting for block confirmation...");
  await deploymentTx?.wait(1); // Reduced to 1 confirmation for faster process
  console.log("Contract deployment confirmed!");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`Contract address: ${iplPlayerCard.target}`);
  console.log(`Network: ${network.name}`);
  console.log(`Explorer URL: https://explorer.testnet.monad.xyz/address/${iplPlayerCard.target}`);
  
  // Get the deployer/owner account
  const [deployer] = await ethers.getSigners();
  console.log(`\nUsing account: ${deployer.address}`);
  
  // Read player metadata files
  const metadataDir = path.join(__dirname, "../player-metadata");
  const metadataFiles = fs.readdirSync(metadataDir)
    .filter(file => file.startsWith("player") && file.endsWith(".json"));

  console.log(`Found ${metadataFiles.length} player metadata files`);
  
  // Helper function to convert decimal values to integers
  const convertToInteger = (value, multiplier = 100) => {
    if (typeof value === 'number') {
      return Math.round(value * multiplier);
    }
    return value || 0;
  };

  // Process players in batches to save gas
  const BATCH_SIZE = 5; // Mint 5 players at a time
  const batches = [];
  
  // Prepare batches
  for (let i = 0; i < metadataFiles.length; i += BATCH_SIZE) {
    batches.push(metadataFiles.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Divided into ${batches.length} batches for gas optimization`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length} (${batch.length} players):`);
    
    // Option 1: Use batch minting for tokenURIs only
    if (process.env.USE_BATCH_MINTING === "true") {
      const tokenURIs = [];
      
      for (const file of batch) {
        const mockIpfsUri = `ipfs://QmPlayerCardsWithImages/${file.replace('.json', '')}`;
        tokenURIs.push(mockIpfsUri);
      }
      
      try {
        console.log(`Batch minting ${tokenURIs.length} NFTs...`);
        const tx = await iplPlayerCard.batchMintPlayerCards(deployer.address, tokenURIs);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait(1);
        console.log(`Successfully minted batch ${batchIndex + 1}`);
      } catch (error) {
        console.error(`Error batch minting NFTs:`, error);
      }
    } 
    // Option 2: Mint individual NFTs (with player data)
    else {
      for (const file of batch) {
        try {
          const metadata = JSON.parse(fs.readFileSync(path.join(metadataDir, file)));
          
          // Extract attributes from metadata
          const getAttributeValue = (traitType) => {
            const attr = metadata.attributes.find(a => a.trait_type === traitType);
            return attr ? attr.value : "";
          };

          console.log(`Minting NFT for ${metadata.name}...`);
          
          // Use the existing IPL image URL from metadata
          const mockIpfsUri = `ipfs://QmPlayerCardsWithImages/${file.replace('.json', '')}`;

          // Create the PlayerInfo struct with integer conversions for decimal fields
          const playerInfo = {
            name: metadata.name,
            description: metadata.description,
            role: getAttributeValue("Role"),
            nationality: getAttributeValue("Nationality"),
            age: convertToInteger(getAttributeValue("Age"), 1),
            previousTeam: getAttributeValue("Previous Team"),
            rarity: getAttributeValue("Rarity"),
            matches: convertToInteger(getAttributeValue("Matches"), 1),
            runs: convertToInteger(getAttributeValue("Runs"), 1),
            battingAverage: convertToInteger(getAttributeValue("Batting Average")),
            strikeRate: convertToInteger(getAttributeValue("Strike Rate")),
            specialty: getAttributeValue("Specialty"),
            externalUrl: metadata.external_url || ""
          };

          // Mint the player NFT
          const tx = await iplPlayerCard.mintPlayerCard(
            deployer.address,
            mockIpfsUri,
            playerInfo
          );

          console.log(`Transaction hash: ${tx.hash}`);
          await tx.wait(1); // Reduced to 1 confirmation
          console.log(`Successfully minted NFT for ${metadata.name}`);
        } catch (error) {
          console.error(`Error minting NFT from ${file}:`, error);
        }
      }
    }
  }

  console.log("\nMinting complete! ✅");

  // Get total NFTs minted
  try {
    const totalSupply = await iplPlayerCard._tokenIdCounter();
    console.log(`Total NFTs minted: ${totalSupply}`);
  } catch (error) {
    console.error("Error getting token counter:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });