const { EmbedBuilder } = require('discord.js');
const { fetchFPLData } = require('../../services/fplService');
const { teamColors } = require('../../canvas/compareCanvas');
const FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/";

async function fetchFPLFixtures() {
    const res = await fetch(FIXTURES_URL);
    if (!res.ok) throw new Error("FPL fixtures request failed");
    return await res.json();
}

module.exports = async function playerHandler(interaction) {
    try {
        const data = await fetchFPLData();
        const fixtures = await fetchFPLFixtures();
        const name = interaction.options.getString("name").toLowerCase();
        const player = data.elements.find(p => (p.first_name + " " + p.second_name).toLowerCase() === name);
        if (!player) return await interaction.reply({ content: 'Player not found!',});

        // Get player Stats
        const team = data.teams.find(t => t.id === player.team);
        const position = data.element_types[player.element_type - 1].singular_name;
        const price = (player.now_cost / 10).toFixed(1);
        const TSB = player.selected_by_percent;

        const ictIdx = player.ict_index;
        const ictRank = player.ict_index_rank_type;
        const totalType = data.elements.filter(p => p.element_type === player.element_type).length;

        const weekPts = player.event_points;

        // Get player fixtures
        const teamFixtures = fixtures.filter(f => f.team_h === player.team || f.team_a === player.team);
        const upcomingFixtures = teamFixtures.filter(f => !f.finished).slice(0, 2);
        const currentFixtures = teamFixtures.filter(f => f.finished).slice(-1);

        const fixturesDisplay = upcomingFixtures.map(f => {
            const isHome = f.team_h === player.team;
            const opponentId = isHome ? f.team_a : f.team_h;
            const opponent = data.teams.find(t => t.id === opponentId);
            return `${isHome ? "H" : "A"} vs ${opponent.name} (GW${f.event})`;
        }).join("\n") || "No upcoming fixture";

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(player.web_name)
            .setColor(teamColors[team.name] || 0x1F8B4C)
            .setThumbnail(`https://resources.premierleague.com/premierleague/photos/players/110x140/p${String(player.code).padStart(6, '0')}.png`)
            .setAuthor({
                name: team.name,
                iconURL: `https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`
            })
            .addFields(
                { name: 'Team', value: team.name, inline: true },
                { name: 'Position', value: position, inline: true },
                { name: 'Price', value: `£${price}m`, inline: true },
                { name: 'Total Points', value: `${player.total_points}`, inline: true },
                { name: 'Form', value: `${player.form}`, inline: true },
                { name: `GW${currentFixtures.length ? currentFixtures[0].event : '-' } Points`, value: `${weekPts}`, inline: true },
                { name: 'Points/Game', value: `${player.points_per_game}`, inline: true },
                { name: 'TSB', value: `${TSB}%`, inline: true },
                { name: 'ICT index', value: `${ictIdx} (${ictRank} out of ${totalType})`, inline: true },
                { name: 'Next Fixtures', value: fixturesDisplay, inline: false }
            )
            .setFooter({ text: 'FPL Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
    catch(err){
        console.error("Error in playerHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching FPL players"});
        } 
    }

};
