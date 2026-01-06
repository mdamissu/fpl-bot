const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchFPLLeague } = require('../../services/leagueService.js');

module.exports = async function ldbHandler(interaction) {
    try {
        const leagueID = interaction.options.getString("league_id") || "314";
        let data = await fetchFPLLeague(leagueID);

        if (!data || data.length === 0) {
            await interaction.reply({ content: `No leaderboard data found for league ${leagueID}`, ephemeral: true });
            return;
        }

        // Build page
        let sortBy = 'total';
        let startIdx = 0;
        const pageSize = 5;
        let reversed = false;

        const sortPlayers = () => {
            if (sortBy === 'total') data.sort((a, b) => b.total - a.total);
            else if (sortBy === 'event') data.sort((a, b) => b.event_total - a.event_total);

            if (reversed) data.reverse(); 
        };
        sortPlayers();

        const makePlayerList = () => {
            const slice = data.slice(startIdx, startIdx + pageSize);
            return slice.map(p => `**${p.entry_name}**\nTotal: ${p.total} | GW: ${p.event_total}`).join("\n\n");
        };

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle(Number(leagueID) === 314 ? "General Leaderboard" : `FPL Leaderboard - League ID: ${leagueID}`)
            .setDescription(makePlayerList());

        const rowButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('this_round').setLabel('This round').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('this_season').setLabel('This season').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('reverse').setLabel('Reverse').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('show_more').setLabel('Show 5 more').setStyle(ButtonStyle.Primary)
            );

        const replyMsg = await interaction.reply({ embeds: [embed], components: [rowButtons], fetchReply: true });

        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: "This isn't for you!", ephemeral: true });

            if (i.isButton()) {
                switch(i.customId) {
                    case 'this_round':
                        sortBy = 'event';
                        startIdx = 0;
                        break;
                    case 'this_season':
                        sortBy = 'total';
                        startIdx = 0;
                        dx = 0;
                        break;
                    case 'reverse':
                        reversed = !reversed;
                        startIdx = 0;
                        break;
                    case 'show_more':
                        startIdx += pageSize;
                        if (startIdx >= data.length) startIdx = 0;
                        break;
                }

                sortPlayers();
                embed.setDescription(makePlayerList());
                i.update({ embeds: [embed], components: [rowButtons] });
            }
        });

    } catch (err) {
        console.error("Error in ldbHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching leaderboard"});
        }
    }
};
