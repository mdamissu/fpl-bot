const { EmbedBuilder } = require('discord.js');
const { fetchFPLData } = require('../../services/fplService');
// Build embed for top 5 scorers/playmakers
module.exports = async function peakHandler(interaction){
    try{
        await interaction.deferReply();

        const data = await fetchFPLData();

        const players = data.elements.map(p => ({
            name: p.first_name + " " + p.second_name,
            goals: p.goals_scored,
            assists: p.assists
        }));

        const topScorers = [...players]
            .sort((a,b)=> b.goals - a.goals)
            .slice(0,5);

        const topAssists = [...players]
            .sort((a,b)=> b.assists - a.assists)
            .slice(0,5);

        const scorersText = topScorers
            .map((p,i)=> `${i+1}. ${p.name}: ⚽ ${p.goals}`)
            .join("\n");

        const assistsText = topAssists
            .map((p,i)=> `${i+1}. ${p.name}: 🅰️ ${p.assists}`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setTitle("EPL Peak Performers")
            .setColor(0x00ff99)
            .addFields(
                { name:"⚽ Top 5 Goals", value: scorersText },
                { name:"🅰️ Top 5 Assists", value: assistsText }
            )
            .setFooter({ text: 'FPL Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' })

        await interaction.editReply({ embeds: [embed] });

    } catch(err){
        console.error(err);
        await interaction.editReply("Error getting top players");
    }
};
