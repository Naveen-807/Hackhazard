const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

async function main() {
  console.log("Starting comprehensive minting of all IPL player cards...");

  // Connect to the deployed contract
  const contractAddress = "0x63793970890B840b51c3e68a10088248F072deeA";
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  const contract = await IPLPlayerCard.attach(contractAddress);
  
  // Get the deployer/owner account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Check if deployer is owner
  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("Deployer is not the contract owner. Only the owner can mint tokens.");
    process.exit(1);
  }

  // Read the CSV mapping of token IDs to CIDs
  const csvPath = path.join(__dirname, "../player_tokens.csv");
  const metadataDir = path.join(__dirname, "../player-metadata");
  
  // Parse CSV file to get token mappings
  const tokenMappings = [];
  await new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        tokenMappings.push({
          tokenId: parseInt(row.tokenID),
          cid: row.cid
        });
      })
      .on("end", () => {
        console.log(`Loaded ${tokenMappings.length} token mappings from CSV`);
        resolve();
      });
  });

  // Sort by token ID to ensure we mint in order
  tokenMappings.sort((a, b) => a.tokenId - b.tokenId);

  // Load player metadata from files
  const playerMetadata = {};
  const files = fs.readdirSync(metadataDir).filter(file => file.startsWith("player") && file.endsWith(".json"));
  for (const file of files) {
    const metadata = JSON.parse(fs.readFileSync(path.join(metadataDir, file)));
    playerMetadata[file] = metadata;
  }

  // Extract attribute value helper function
  const getAttributeValue = (attributes, traitType, defaultValue = "") => {
    const attr = attributes.find(a => a.trait_type === traitType);
    return attr ? attr.value : defaultValue;
  };

  console.log("Preparing to mint all player NFTs...");
  
  // Mint each player card
  let successCount = 0;
  let failureCount = 0;
  
  for (const mapping of tokenMappings) {
    try {
      // Get the file name from the CID or use direct CID if no filename included
      let fileName;
      let jsonData;
      
      if (mapping.cid.includes("/")) {
        // Format is ipfs://CID/playerX.json
        fileName = mapping.cid.substring(mapping.cid.lastIndexOf('/') + 1);
        jsonData = playerMetadata[fileName];
      } else {
        // Format is direct CID, we need to look up by token ID
        const filesByTokenId = {
          2: "player4.json",
          3: "player6.json",
          4: "player7.json",
          5: "player10.json",
          6: "player12.json", 
          7: "player13.json",
          8: "player14.json",
          9: "player16.json",
          10: "player17.json",
          11: "player20.json"
        };
        
        fileName = filesByTokenId[mapping.tokenId];
        jsonData = playerMetadata[fileName];
      }
      
      if (!jsonData) {
        console.error(`Missing metadata for token ID ${mapping.tokenId}`);
        failureCount++;
        continue;
      }
      
      console.log(`Minting NFT for ${jsonData.name} (Token ID: ${mapping.tokenId})...`);

      // Convert numeric values to integers
      const getNumericValue = (attributes, traitType, multiplier = 1) => {
        const value = getAttributeValue(attributes, traitType, 0);
        if (typeof value === 'number') {
          return Math.round(value * multiplier);
        }
        return 0;
      };
      
      // Create the PlayerInfo struct
      const playerInfo = {
        name: jsonData.name,
        description: jsonData.description,
        role: getAttributeValue(jsonData.attributes, "Role"),
        nationality: getAttributeValue(jsonData.attributes, "Nationality"),
        age: getNumericValue(jsonData.attributes, "Age"),
        previousTeam: getAttributeValue(jsonData.attributes, "Previous Team"),
        rarity: getAttributeValue(jsonData.attributes, "Rarity"),
        matches: getNumericValue(jsonData.attributes, "Matches"),
        runs: getNumericValue(jsonData.attributes, "Runs"),
        battingAverage: getNumericValue(jsonData.attributes, "Batting Average", 100), // Convert to integer by multiplying by 100
        strikeRate: getNumericValue(jsonData.attributes, "Strike Rate", 100), // Convert to integer by multiplying by 100
        specialty: getAttributeValue(jsonData.attributes, "Specialty"),
        externalUrl: jsonData.external_url || ""
      };
      
      // Remove ipfs:// prefix if present as the contract adds it automatically
      let tokenURI = mapping.cid;
      if (tokenURI.startsWith("ipfs://")) {
        tokenURI = tokenURI.slice(7);
      }
      
      // Mint the player NFT
      const tx = await contract.mintPlayerCard(
        deployer.address,
        tokenURI,
        playerInfo,
        { gasLimit: 5000000 } // Adjust gas limit as needed
      );
      
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Successfully minted NFT for ${jsonData.name}`);
      successCount++;
      
    } catch (error) {
      console.error(`Error minting token ID ${mapping.tokenId}:`, error.message);
      failureCount++;
    }
  }

  console.log("\nMinting Summary:");
  console.log(`Successfully minted: ${successCount} NFTs`);
  console.log(`Failed to mint: ${failureCount} NFTs`);

  // Check total supply
  try {
    const totalSupply = await contract._tokenIdCounter();
    console.log(`Total NFTs in the collection: ${totalSupply}`);
  } catch (error) {
    console.log("Could not fetch total supply.", error.message);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });