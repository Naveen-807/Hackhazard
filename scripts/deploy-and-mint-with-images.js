const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying IPLPlayerCard contract and minting tokens with proper image URLs...");

  // Get the contract factory
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  
  // Deploy the contract
  const iplPlayerCard = await IPLPlayerCard.deploy();
  
  // Get deployment info
  const deploymentTx = iplPlayerCard.deploymentTransaction();
  
  console.log(`IPLPlayerCard deployed to: ${iplPlayerCard.target}`);
  console.log("Deployment transaction hash:", deploymentTx?.hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await deploymentTx?.wait(2);
  console.log("Contract deployment confirmed!");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`Contract name: IPLPlayerCard`);
  console.log(`Contract address: ${iplPlayerCard.target}`);
  console.log(`Network: ${network.name}`);
  console.log(`Explorer URL: https://explorer.testnet.monad.xyz/address/${iplPlayerCard.target}`);
  
  // Now mint the NFTs with proper metadata that includes IPL image URLs
  console.log("\nStarting to mint NFTs with proper image URLs...");
  
  // Get the deployer/owner account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Read player metadata files
  const metadataDir = path.join(__dirname, "../player-metadata");
  const metadataFiles = fs.readdirSync(metadataDir).filter(file => file.startsWith("player") && file.endsWith(".json"));

  console.log(`Found ${metadataFiles.length} player metadata files`);
  
  // Helper function to convert decimal values to integers (with a multiplier for precision)
  const convertToInteger = (value, multiplier = 100) => {
    if (typeof value === 'number') {
      // Convert decimal to integer (e.g., 37.97 -> 3797)
      return Math.round(value * multiplier);
    }
    return value || 0;
  };

  // Create a directory to store our proper metadata with image URLs
  const updatedMetadataDir = path.join(__dirname, "../updated-metadata");
  if (!fs.existsSync(updatedMetadataDir)) {
    fs.mkdirSync(updatedMetadataDir);
  }
  
  // Mint each player NFT with proper metadata
  for (const file of metadataFiles) {
    try {
      const metadata = JSON.parse(fs.readFileSync(path.join(metadataDir, file)));
      
      // Extract attributes from metadata
      const getAttributeValue = (traitType) => {
        const attr = metadata.attributes.find(a => a.trait_type === traitType);
        return attr ? attr.value : "";
      };

      console.log(`Minting NFT for ${metadata.name}...`);
      
      // Create updated metadata with the player's image URL
      const updatedMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image, // Use the existing IPL image URL from metadata
        attributes: metadata.attributes,
        external_url: metadata.external_url || ""
      };
      
      // Save updated metadata to file
      const updatedFile = path.join(updatedMetadataDir, file);
      fs.writeFileSync(updatedFile, JSON.stringify(updatedMetadata, null, 2));
      
      // For a real implementation, upload this metadata to IPFS
      // For this demo, we'll use a mock IPFS URI that references the file name
      const mockIpfsUri = `ipfs://QmPlayerCardsWithImages/${file.replace('.json', '')}`;

      // Create the PlayerInfo struct object with integer conversions for decimal fields
      const playerInfo = {
        name: metadata.name,
        description: metadata.description,
        role: getAttributeValue("Role"),
        nationality: getAttributeValue("Nationality"),
        age: convertToInteger(getAttributeValue("Age"), 1), // Age as integer
        previousTeam: getAttributeValue("Previous Team"),
        rarity: getAttributeValue("Rarity"),
        matches: convertToInteger(getAttributeValue("Matches"), 1), // Matches as integer
        runs: convertToInteger(getAttributeValue("Runs"), 1), // Runs as integer
        battingAverage: convertToInteger(getAttributeValue("Batting Average")), // Convert to integer (x100)
        strikeRate: convertToInteger(getAttributeValue("Strike Rate")), // Convert to integer (x100)
        specialty: getAttributeValue("Specialty"),
        externalUrl: metadata.external_url || ""
      };
      
      console.log(`Player info for ${metadata.name} with image URL: ${metadata.image}`);

      // Mint the player NFT with all metadata
      const tx = await iplPlayerCard.mintPlayerCard(
        deployer.address,
        mockIpfsUri,
        playerInfo
      );

      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait(1); // Wait for 1 confirmation
      console.log(`Successfully minted NFT for ${metadata.name}`);
    } catch (error) {
      console.error(`Error minting NFT from ${file}:`, error);
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
  
  console.log("\nNOTE: In a production environment, you would need to:");
  console.log("1. Upload the metadata files from 'updated-metadata' directory to IPFS");
  console.log("2. Use the actual IPFS URIs instead of the mock ones");
  console.log(`3. View your NFTs at: https://explorer.testnet.monad.xyz/address/${iplPlayerCard.target}`);
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });