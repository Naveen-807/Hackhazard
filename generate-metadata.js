const fs = require('fs');
const path = require('path');

// Import player data from player-info.ts
const playerInfoFile = fs.readFileSync('./src/services/player-info.ts', 'utf8');

// Extract player data array using regex
const playersArrayMatch = playerInfoFile.match(/const iplPlayers: PlayerInfo\[] = \[([\s\S]*?)\];/);
let playersData = [];

if (playersArrayMatch && playersArrayMatch[1]) {
  const playersText = playersArrayMatch[1];
  
  // Extract individual player objects
  const playerRegex = /\{\s*playerId: "(player\d+)",\s*name: "([^"]+)",\s*role: "([^"]+)",\s*nationality: "([^"]+)",\s*age: (\d+),\s*previousTeam: "([^"]+)",\s*specialty: "([^"]+)",\s*stats: \{\s*battingAverage: ([^,]+),\s*economy: ([^,]+),\s*strikeRate\??: ([^,]+),\s*(?:wickets\??: ([^,]+),)?\s*(?:runs\??: ([^,]+),)?\s*(?:matches\??: ([^,]+),?)?\s*\},\s*imageUrl: "([^"]+)",\s*basePrice: ([^,]+),/g;
  
  let match;
  while ((match = playerRegex.exec(playersText)) !== null) {
    playersData.push({
      playerId: match[1],
      name: match[2],
      role: match[3],
      nationality: match[4],
      age: parseInt(match[5]),
      previousTeam: match[6],
      specialty: match[7],
      stats: {
        battingAverage: parseFloat(match[8]),
        economy: parseFloat(match[9]),
        strikeRate: match[10] ? parseFloat(match[10]) : null,
        wickets: match[11] ? parseInt(match[11]) : null,
        runs: match[12] ? parseInt(match[12]) : null,
        matches: match[13] ? parseInt(match[13]) : null
      },
      imageUrl: match[14].startsWith('C:') ? `/assets/players/${match[1]}.png` : match[14],
      basePrice: parseFloat(match[15])
    });
  }
}

console.log(`Extracted ${playersData.length} players from source file`);

// Function to determine rarity based on player stats
function determineRarity(player) {
  // Use a combination of stats to determine rarity
  let score = 0;
  
  // Calculate score based on matches played (experience)
  if (player.stats.matches) {
    if (player.stats.matches > 200) score += 5;
    else if (player.stats.matches > 150) score += 4;
    else if (player.stats.matches > 100) score += 3;
    else if (player.stats.matches > 50) score += 2;
    else score += 1;
  }
  
  // Calculate score based on batting stats (if batsman or all-rounder)
  if (player.role === "Batsman" || player.role === "All-Rounder" || player.role === "Wicket-Keeper") {
    if (player.stats.battingAverage > 40) score += 5;
    else if (player.stats.battingAverage > 35) score += 4;
    else if (player.stats.battingAverage > 30) score += 3;
    else if (player.stats.battingAverage > 25) score += 2;
    else score += 1;
    
    if (player.stats.strikeRate && player.stats.strikeRate > 150) score += 5;
    else if (player.stats.strikeRate && player.stats.strikeRate > 140) score += 4;
    else if (player.stats.strikeRate && player.stats.strikeRate > 130) score += 3;
    else if (player.stats.strikeRate && player.stats.strikeRate > 120) score += 2;
    else if (player.stats.strikeRate) score += 1;
  }
  
  // Calculate score based on bowling stats (if bowler or all-rounder)
  if (player.role === "Bowler" || player.role === "All-Rounder") {
    if (player.stats.economy < 7) score += 5;
    else if (player.stats.economy < 7.5) score += 4;
    else if (player.stats.economy < 8) score += 3;
    else if (player.stats.economy < 8.5) score += 2;
    else score += 1;
    
    if (player.stats.wickets && player.stats.wickets > 150) score += 5;
    else if (player.stats.wickets && player.stats.wickets > 100) score += 4;
    else if (player.stats.wickets && player.stats.wickets > 75) score += 3;
    else if (player.stats.wickets && player.stats.wickets > 50) score += 2;
    else if (player.stats.wickets) score += 1;
  }
  
  // Calculate rarity based on total score
  if (score >= 15) return "Legendary";
  else if (score >= 12) return "Epic";
  else if (score >= 9) return "Rare";
  else if (score >= 6) return "Uncommon";
  else return "Common";
}

// Function to create a catchy description based on player's role and specialty
function createDescription(player) {
  const descriptions = {
    Batsman: [
      `${player.specialty}. A batting powerhouse from ${player.previousTeam}.`,
      `${player.name} - The run machine of ${player.previousTeam}.`,
      `Feared by bowlers worldwide, ${player.name} brings explosive ${player.specialty} to the pitch.`
    ],
    Bowler: [
      `${player.specialty}. A bowling sensation from ${player.previousTeam}.`,
      `${player.name} - The wicket-taking machine of ${player.previousTeam}.`,
      `A nightmare for batsmen, ${player.name} brings devastating ${player.specialty} to every match.`
    ],
    "All-Rounder": [
      `${player.specialty}. A versatile all-rounder from ${player.previousTeam}.`,
      `${player.name} - The complete package from ${player.previousTeam}.`,
      `Dominating with both bat and ball, ${player.name} is known for ${player.specialty}.`
    ],
    "Wicket-Keeper": [
      `${player.specialty}. A wicket-keeping sensation from ${player.previousTeam}.`,
      `${player.name} - The safe hands behind the stumps from ${player.previousTeam}.`,
      `Lightning-fast glove work and ${player.specialty}, ${player.name} is a game-changer.`
    ]
  };

  const roleDescriptions = descriptions[player.role];
  if (roleDescriptions) {
    return roleDescriptions[Math.floor(Math.random() * roleDescriptions.length)];
  }
  
  return `${player.name} - ${player.specialty} specialist from ${player.previousTeam}.`;
}

// Create metadata for each player
const metadata = playersData.map(player => {
  const rarity = determineRarity(player);
  const description = createDescription(player);
  const slugName = player.name.toLowerCase().replace(/\s+/g, '-');
  
  // Core attributes for all players
  const attributes = [
    { trait_type: "Role", value: player.role },
    { trait_type: "Nationality", value: player.nationality },
    { trait_type: "Age", value: player.age },
    { trait_type: "Previous Team", value: player.previousTeam },
    { trait_type: "Rarity", value: rarity },
    { trait_type: "Matches", value: player.stats.matches || 0 }
  ];
  
  // Add role-specific attributes
  if (player.role === "Batsman" || player.role === "All-Rounder" || player.role === "Wicket-Keeper") {
    attributes.push({ trait_type: "Batting Average", value: player.stats.battingAverage });
    if (player.stats.strikeRate) attributes.push({ trait_type: "Strike Rate", value: player.stats.strikeRate });
    if (player.stats.runs) attributes.push({ trait_type: "Runs", value: player.stats.runs });
  }
  
  if (player.role === "Bowler" || player.role === "All-Rounder") {
    attributes.push({ trait_type: "Economy", value: player.stats.economy });
    if (player.stats.wickets) attributes.push({ trait_type: "Wickets", value: player.stats.wickets });
  }
  
  // Add specialty as an attribute
  attributes.push({ trait_type: "Specialty", value: player.specialty });
  
  return {
    name: player.name,
    description: description,
    image: player.imageUrl,
    attributes: attributes,
    external_url: `https://myiplgame.com/player/${slugName}`
  };
});

// Create output directory if it doesn't exist
const outputDir = './player-metadata';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Write each player's metadata to a separate JSON file
metadata.forEach((playerMetadata, index) => {
  const playerId = playersData[index].playerId;
  const filePath = path.join(outputDir, `${playerId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(playerMetadata, null, 2));
  console.log(`Generated metadata file: ${filePath}`);
});

console.log(`Successfully created ${metadata.length} player metadata files in the ${outputDir} directory.`);