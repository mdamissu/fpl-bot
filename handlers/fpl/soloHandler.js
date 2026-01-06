const { EmbedBuilder } = require('discord.js');
const { fetchSquad, verifyEntry } = require('../../services/myteamService');
const { fetchFPLData } = require('../../services/fplService');


function formatCompare(a, b, isRank=false, da=null, db=null){
    const va = Number(a);
    const vb = Number(b);

    const sa = da ?? String(a);
    const sb = db ?? String(b);

    if (va === vb) return `**${sa}** vs **${sb}**`;

    // Ranking logic: Bold for higher val
    const aWins = isRank ? va < vb : va > vb;

    return aWins
        ? `**${sa}**  vs  ${sb}`
        : `${sa}  vs  **${sb}**`;
}
// Sum of one player's squad
function sumSquadValue(picks, players){
    return picks.reduce((acc, p) => {
        const pl = players.find(x => x.id === p.element);
        return acc + ((pl?.now_cost || 0) / 10);
    }, 0);
}


module.exports = async function soloHandler(interaction) {

    try{
        // Get player ids

        const id1 = interaction.options.getInteger('user1');
        const id2 = interaction.options.getInteger('user2');

        const user1 = await verifyEntry(id1);
        const user2 = await verifyEntry(id2);

        const currentGW = user1.current_event;

        // Get player squad
        const squad1 = await fetchSquad(id1);
        const squad2 = await fetchSquad(id2);

        const picks1 = squad1[currentGW - 1]?.picks || [];
        const picks2 = squad2[currentGW - 1]?.picks || [];

        const fplData = await fetchFPLData();
        const players = fplData.elements;

        const squadValue1 = sumSquadValue(picks1, players);
        const squadValue2 = sumSquadValue(picks2, players);

        const sq1Display = squadValue1.toFixed(1);
        const sq2Display = squadValue2.toFixed(1);

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle('⚔️ FPL HEAD-TO-HEAD')
            .setDescription(
                `**${user1.name}**  vs  **${user2.name}**`
            )
            .addFields(

                {
                    name: "🏆 Overall Points",
                    value: formatCompare(
                        user1.summary_overall_points,
                        user2.summary_overall_points
                    ),
                    inline: true
                },

                {
                    name: "📊 Overall Rank",
                    value: formatCompare(
                        user1.summary_overall_rank,
                        user2.summary_overall_rank,
                        true
                    ),
                    inline: true
                },

                {
                    name: "🎯 GW Points",
                    value: formatCompare(
                        user1.summary_event_points,
                        user2.summary_event_points
                    ),
                    inline: true
                },

                {
                    name: "📈 GW Rank",
                    value: formatCompare(
                        user1.summary_event_rank,
                        user2.summary_event_rank,
                        true
                    ),
                    inline: true
                },

                {
                    name: "🌐 Region",
                    value: `${user1.player_region_name}  —  ${user2.player_region_name}`,
                    inline: true
                },

                {
                    name: "💰 Squad Value",
                    value:
                        formatCompare(
                            squadValue1,
                            squadValue2,
                            false,
                            sq1Display,
                            sq2Display
                        ) + " m",
                    inline: true
                }

            )
            .setColor(0x1F8B4C)
            .setFooter({
                text: "FPL Bot",
                iconURL: "https://i.imgur.com/AfFp7pu.png"
            })
            .setTimestamp();

        await interaction.reply({ embeds:[embed] });

    }
    catch(err){

        console.error("Error in soloHandler:", err);

        if(!interaction.replied){
            await interaction.reply({
                content: "Error fetching FPL teams",
            });
        }
    }
};
