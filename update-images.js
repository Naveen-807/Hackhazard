const fs = require('fs');
const path = require('path');

// Player IDs to IPL image URLs mapping
const playerImageMapping = {
  // Read from player-service.ts
  "player1": "https://assets.iplt20.com/ipl/IPLHeadshot2022/164.png", // Virat Kohli
  "player2": "https://assets.iplt20.com/ipl/IPLHeadshot2022/107.png", // Rohit Sharma
  "player3": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1124.png", // Jasprit Bumrah
  "player4": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1.png", // MS Dhoni
  "player5": "https://assets.iplt20.com/ipl/IPLHeadshot2022/9.png", // Ravindra Jadeja
  "player6": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1125.png", // KL Rahul
  "player7": "https://assets.iplt20.com/ipl/IPLHeadshot2022/2972.png", // Rishabh Pant
  "player8": "https://assets.iplt20.com/ipl/IPLHeadshot2022/2885.png", // Rashid Khan
  "player10": "https://assets.iplt20.com/ipl/IPLHeadshot2022/170.png", // David Warner
  "player11": "https://assets.iplt20.com/ipl/IPLHeadshot2022/111.png", // Yuzvendra Chahal
  "player12": "https://assets.iplt20.com/ipl/IPLHeadshot2022/108.png", // Suryakumar Yadav
  "player13": "https://assets.iplt20.com/ipl/IPLHeadshot2022/2972.png", // Rishabh Pant
  "player14": "https://assets.iplt20.com/ipl/IPLHeadshot2022/440.png", // Kane Williamson
  "player16": "https://assets.iplt20.com/ipl/IPLHeadshot2022/509.png", // Jos Buttler
  "player17": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1563.png", // Shreyas Iyer
  "player20": "https://assets.iplt20.com/ipl/IPLHeadshot2022/24.png", // Faf du Plessis
  "player21": "https://assets.iplt20.com/ipl/IPLHeadshot2022/834.png", // Quinton de Kock
  "player22": "https://assets.iplt20.com/ipl/IPLHeadshot2022/41.png", // Shikhar Dhawan
  "player27": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1703.png", // Nicholas Pooran
  "player30": "https://assets.iplt20.com/ipl/IPLHeadshot2022/1705.png", // Shimron Hetmyer
  "player32": "https://assets.iplt20.com/ipl/IPLHeadshot2022/506.png", // Jonny Bairstow
  "player33": "https://assets.iplt20.com/ipl/IPLHeadshot2022/102.png", // Dinesh Karthik
  "player35": "https://assets.iplt20.com/ipl/IPLHeadshot2022/3761.png", // Shubman Gill
  "player37": "https://assets.iplt20.com/ipl/IPLHeadshot2022/2975.png", // Ishan Kishan
  "player39": "https://assets.iplt20.com/ipl/IPLHeadshot2022/4951.png", // Tim David
  "player43": "https://assets.iplt20.com/ipl/IPLHeadshot2022/16.png", // Wriddhiman Saha
  "player45": "https://assets.iplt20.com/ipl/IPLHeadshot2022/20572.png", // Devon Conway
  "player50": "https://assets.iplt20.com/ipl/IPLHeadshot2022/10057.png", // Harry Brook
  "player52": "https://assets.iplt20.com/ipl/IPLHeadshot2022/3830.png", // Rinku Singh
  "player53": "https://assets.iplt20.com/ipl/IPLHeadshot2022/3838.png", // Rahul Tripathi
  "player58": "https://assets.iplt20.com/ipl/IPLHeadshot2022/20594.png", // Arshad Khan
  "player62": "https://assets.iplt20.com/ipl/IPLHeadshot2022/15154.png", // Tilak Varma
  
  // For any player without specific mapping, use a fallback image
  "default": "https://assets.iplt20.com/ipl/IPLHeadshot2022/Photo-Missing.png"
};

// Function to update image URL in metadata
function updateMetadataWithIPLImage(playerMetadataPath) {
  try {
    const playerJsonFile = fs.readFileSync(playerMetadataPath, 'utf8');
    const playerData = JSON.parse(playerJsonFile);
    const playerId = path.basename(playerMetadataPath, '.json');
    
    // Update the image URL
    const imageUrl = playerImageMapping[playerId] || playerImageMapping.default;
    playerData.image = imageUrl;
    
    // Write the updated JSON back to the file
    fs.writeFileSync(playerMetadataPath, JSON.stringify(playerData, null, 2));
    console.log(`Updated image URL for ${playerId} to ${imageUrl}`);
  } catch (error) {
    console.error(`Error updating ${playerMetadataPath}:`, error);
  }
}

// Get all JSON files in the player-metadata directory
const metadataDir = './player-metadata';
const files = fs.readdirSync(metadataDir);

// Update each file
let updatedCount = 0;
files.forEach(file => {
  if (file.endsWith('.json')) {
    updateMetadataWithIPLImage(path.join(metadataDir, file));
    updatedCount++;
  }
});

console.log(`Successfully updated ${updatedCount} player metadata files with IPL image URLs.`);