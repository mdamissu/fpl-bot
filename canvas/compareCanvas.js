// services/compareCanvas.js
const { createCanvas, loadImage } = require('canvas');

const teamColors = {
    "Arsenal": "#EF0107",
    "Aston Villa": "#95BFE5",
    "Bournemouth": "#DA291C",
    "Brentford": "#E30613",
    "Brighton & Hove Albion": "#0057B8",
    "Chelsea": "#034694",
    "Crystal Palace": "#1B458F",
    "Everton": "#003399",
    "Fulham": "#000000",
    "Liverpool": "#C8102E",
    "Luton Town": "#FDBA12",
    "Manchester City": "#6CABDD",
    "Manchester United": "#DA291C",
    "Newcastle United": "#241F20",
    "Nottingham Forest": "#E31B23",
    "Sheffield United": "#EE2737",
    "Tottenham Hotspur": "#132257",
    "West Ham United": "#7A263A",
    "Wolverhampton Wanderers": "#FDB913",
    "Brighton": "#0057B8"
};

async function generateCompareCanvas(player1, player2, data) {
    const width = 1000;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad1 = ctx.createLinearGradient(0, 0, width/2, height);
    grad1.addColorStop(0, teamColors[data.teams.find(t=>t.id===player1.team).name] || "#1F8B4C");
    grad1.addColorStop(1, "#1F1F1F");
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width/2, height);

    const grad2 = ctx.createLinearGradient(width/2, 0, width, height);
    grad2.addColorStop(0, teamColors[data.teams.find(t=>t.id===player2.team).name] || "#1F8B4C");
    grad2.addColorStop(1, "#1F1F1F");
    ctx.fillStyle = grad2;
    ctx.fillRect(width/2, 0, width/2, height);

    // Divider
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();

    // Load images
    const img1 = await loadImage(`https://resources.premierleague.com/premierleague/photos/players/110x140/p${String(player1.code).padStart(6,'0')}.png`);
    const img2 = await loadImage(`https://resources.premierleague.com/premierleague/photos/players/110x140/p${String(player2.code).padStart(6,'0')}.png`);

    // Smaller player images
    ctx.drawImage(img1, 70, 40, 150, 225);
    ctx.drawImage(img2, width/2 + 70, 40, 150, 225);

    // Team logos
    const team1 = data.teams.find(t => t.id === player1.team);
    const team2 = data.teams.find(t => t.id === player2.team);
    const logo1 = await loadImage(`https://resources.premierleague.com/premierleague/badges/50/t${team1.code}.png`);
    const logo2 = await loadImage(`https://resources.premierleague.com/premierleague/badges/50/t${team2.code}.png`);
    ctx.drawImage(logo1, 70, 10, 50, 50);
    ctx.drawImage(logo2, width/2 + 70, 10, 50, 50);

    // Feature table in center
    const features = ['Team', 'Position', 'Price', 'Total Points', 'Form', 'Points/Game'];
    const p1Values = [
        team1.name,
        data.element_types[player1.element_type-1].singular_name,
        `£${(player1.now_cost/10).toFixed(1)}m`,
        player1.total_points,
        player1.form,
        player1.points_per_game,
    ];
    const p2Values = [
        team2.name,
        data.element_types[player2.element_type-1].singular_name,
        `£${(player2.now_cost/10).toFixed(1)}m`,
        player2.total_points,
        player2.form,
        player2.points_per_game
    ];

    const startY = 280;
    const lineHeight = 28;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";

    for (let i = 0; i < features.length; i++) {
        const y = startY + i*lineHeight;
        ctx.fillText(features[i], width/2, y);
        ctx.fillText(p1Values[i], width/4, y);
        ctx.fillText(p2Values[i], 3*width/4, y);
    }

    return canvas.toBuffer();
}

module.exports = { generateCompareCanvas, teamColors };
