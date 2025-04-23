const fs = require('fs');
const https = require('https');
const path = require('path');

const players = [
  { id: "player1", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/164.png" },
  { id: "player2", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/107.png" },
  { id: "player3", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1124.png" },
  { id: "player4", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1.png" },
  { id: "player5", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/9.png" },
  { id: "player6", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1125.png" },
  { id: "player7", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/509.png" },
  { id: "player8", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2885.png" },
  { id: "player9", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2740.png" },
  { id: "player10", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/170.png" },
  { id: "player11", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/111.png" },
  { id: "player12", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/108.png" },
  { id: "player13", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2972.png" },
  { id: "player14", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/440.png" },
  { id: "player15", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1664.png" },
  { id: "player16", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/509.png" },
  { id: "player17", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1563.png" },
  { id: "player18", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/282.png" },
  { id: "player19", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/116.png" },
  { id: "player20", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/24.png" },
  { id: "player21", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/834.png" },
  { id: "player22", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/41.png" },
  { id: "player23", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/969.png" },
  { id: "player24", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1113.png" },
  { id: "player25", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/969.png" },
  { id: "player26", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3183.png" },
  { id: "player27", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1703.png" },
  { id: "player28", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/261.png" },
  { id: "player29", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3840.png" },
  { id: "player30", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1705.png" },
  { id: "player31", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/94.png" },
  { id: "player32", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/506.png" },
  { id: "player33", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/102.png" },
  { id: "player34", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3644.png" },
  { id: "player35", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3761.png" },
  { id: "player36", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1745.png" },
  { id: "player37", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2975.png" },
  { id: "player38", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/140.png" },
  { id: "player39", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/4523.png" },
  { id: "player40", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3831.png" },
  { id: "player41", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1561.png" },
  { id: "player42", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2973.png" },
  { id: "player43", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/16.png" },
  { id: "player44", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/15154.png" },
  { id: "player45", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20572.png" },
  { id: "player46", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3834.png" },
  { id: "player47", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/4698.png" },
  { id: "player48", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/1748.png" },
  { id: "player49", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20570.png" },
  { id: "player50", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20620.png" },
  { id: "player51", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3502.png" },
  { id: "player52", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/2738.png" },
  { id: "player53", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3838.png" },
  { id: "player54", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/157.png" },
  { id: "player55", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/5433.png" },
  { id: "player56", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/19352.png" },
  { id: "player57", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/17068.png" },
  { id: "player58", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3830.png" },
  { id: "player59", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/8540.png" },
  { id: "player60", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3187.png" },
  { id: "player61", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/3763.png" },
  { id: "player62", url: "https://assets.iplt20.com/ipl/IPLHeadshot2022/20574.png" },
];

const outDir = path.join(__dirname, 'public', 'assets', 'players');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

players.forEach(player => {
  const file = fs.createWriteStream(path.join(outDir, `${player.id}.png`));
  https.get(player.url, response => {
    response.pipe(file);
    file.on('finish', () => file.close());
  });
});