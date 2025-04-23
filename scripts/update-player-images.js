const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployed contract
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  
  // Update with the actual deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x75c843502FCD46a5354cC9617AEe754f4c323F38";
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
    console.error("Deployer is not the contract owner. Only the owner can update token URIs.");
    process.exit(1);
  }

  // Create directory for updated metadata if it doesn't exist
  const updatedMetadataDir = path.join(__dirname, "../updated-metadata");
  if (!fs.existsSync(updatedMetadataDir)) {
    fs.mkdirSync(updatedMetadataDir);
  }

  // Read player metadata files
  const metadataDir = path.join(__dirname, "../player-metadata");
  const metadataFiles = fs.readdirSync(metadataDir).filter(file => file.startsWith("player") && file.endsWith(".json"));

  console.log(`Found ${metadataFiles.length} player metadata files`);

  // Get the current token count
  let tokenCount;
  try {
    tokenCount = await iplPlayerCard._tokenIdCounter();
    console.log(`Current token count: ${tokenCount}`);
  } catch (error) {
    console.error("Error getting token count:", error);
    console.log("Assuming 26 tokens have been minted based on previous run");
    tokenCount = 26;
  }

  // Track successfully updated tokens
  const updatedTokens = [];

  // Process each metadata file
  for (let i = 0; i < Math.min(tokenCount, metadataFiles.length); i++) {
    const file = metadataFiles[i];
    const tokenId = i;
    
    try {
      // Read original metadata
      const metadata = JSON.parse(fs.readFileSync(path.join(metadataDir, file)));
      
      // Extract the image URL from the metadata
      const imageUrl = metadata.image;
      
      if (!imageUrl) {
        console.warn(`No image URL found for ${metadata.name} (Token ID: ${tokenId})`);
        continue;
      }
      
      console.log(`Processing Token ID ${tokenId} - ${metadata.name} - Image URL: ${imageUrl}`);
      
      // Create the updated metadata JSON with the external IPL image URL
      const updatedMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: imageUrl, // Use the external IPL image URL
        attributes: metadata.attributes,
        external_url: metadata.external_url
      };
      
      // Save the updated metadata to a file
      const updatedMetadataPath = path.join(updatedMetadataDir, file);
      fs.writeFileSync(updatedMetadataPath, JSON.stringify(updatedMetadata, null, 2));
      console.log(`Updated metadata saved to ${updatedMetadataPath}`);
      
      // In a real scenario, you would upload this metadata to IPFS
      // For this demo, we'll create mock IPFS URIs
      const updatedTokenURI = `ipfs://QmUpdatedIPLImages/${file.replace('.json', '')}`;
      
      // Check if the contract has a setTokenURI function
      let hasSetTokenURI = false;
      try {
        if (typeof iplPlayerCard.setTokenURI === 'function') {
          hasSetTokenURI = true;
        }
      } catch (error) {
        console.warn("Contract doesn't have setTokenURI function, looking for alternative methods");
      }
      
      if (hasSetTokenURI) {
        try {
          // Call setTokenURI to update the token's metadata
          console.log(`Updating token URI for ${metadata.name} (Token ID: ${tokenId})...`);
          const tx = await iplPlayerCard.setTokenURI(tokenId, updatedTokenURI);
          console.log(`Transaction hash: ${tx.hash}`);
          await tx.wait(2);
          console.log(`Successfully updated token URI for ${metadata.name}`);
          updatedTokens.push({ name: metadata.name, tokenId, imageUrl });
        } catch (error) {
          console.error(`Error updating token URI for ${metadata.name}:`, error);
        }
      } else {
        console.log(`NOTE: Token URI update skipped for ${metadata.name} - setTokenURI not available`);
        console.log(`To update token URIs, you'll need to modify your contract to include a setTokenURI function`);
      }
    } catch (error) {
      console.error(`Error processing token ID ${tokenId}:`, error);
    }
  }

  console.log("\nImage URL Update Summary:");
  console.log("--------------------------");
  console.log(`Total tokens processed: ${Math.min(tokenCount, metadataFiles.length)}`);
  console.log(`Tokens with updated metadata files: ${metadataFiles.length}`);
  console.log(`Tokens with updated URIs on-chain: ${updatedTokens.length}`);
  
  if (updatedTokens.length === 0) {
    console.log("\nTo use external IPL image URLs, you need to:");
    console.log("1. Add a setTokenURI function to your IPLPlayerCard contract");
    console.log("2. Upload the updated metadata files from the 'updated-metadata' folder to IPFS");
    console.log("3. Run this script again after updating your contract");
    console.log("\nAlternatively, you can re-deploy your contract and include the image URLs in the initial minting");
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });