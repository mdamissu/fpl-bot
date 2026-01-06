const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { fetchFPLData } = require('../../services/fplService');
const { teamColors } = require('../../canvas/compareCanvas');

module.exports = async function teamHandler(interaction) {
    try {
        const data = await fetchFPLData();
        const teamName = interaction.options.getString("team").toLowerCase();
        const team = data.teams.find(t => t.name.toLowerCase() === teamName);
        if (!team) return await interaction.reply({ content: 'Team not found!', ephemeral: true });

        let players = data.elements.filter(p => p.team === team.id);
        let sortBy = 'total_points';
        let startIdx = 0;
        const pageSize = 5;

        const sortPlayers = () => {
            if (sortBy === 'total_points') players.sort((a, b) => b.total_points - a.total_points);
            else if (sortBy === 'points_per_game') players.sort((a, b) => b.points_per_game - a.points_per_game);
            else if (sortBy === 'now_cost') players.sort((a, b) => b.now_cost - a.now_cost);
            else if (sortBy === 'selected_by_percent') players.sort((a, b) => b.selected_by_percent - a.selected_by_percent);
            else if (sortBy === 'position') players.sort((a, b) => a.element_type - b.element_type);
        };
        sortPlayers();

        const makePlayerList = () => {
            const slice = players.slice(startIdx, startIdx + pageSize);
            const W_NAME = 15, W_POS = 10, W_PTS = 5, W_PPM = 5, W_PRICE = 7, W_TSB = 6;
            const lines = slice.map((p) => {
                const name = p.web_name.slice(0, W_NAME).padEnd(W_NAME);
                const pos = data.element_types[p.element_type - 1].singular_name.slice(0, W_POS).padEnd(W_POS);
                const pts = String(p.total_points).padStart(W_PTS);
                const ppm = Number(p.points_per_game).toFixed(2).padStart(W_PPM);
                const price = ((p.now_cost / 10).toFixed(1)).padStart(W_PRICE);
                const tsb = (Number(p.selected_by_percent).toFixed(1) + "%").padStart(W_TSB);
                return `${name}|${pos}|${pts}|${ppm}|${price}|${tsb}`;
            });
            return "```" + "PLAYER          |POSITION  |PTS  |PPM  |PRICE  |TSB%\n" +
                            "---------------+----------+-----+-----+-------+------\n" +
                            lines.join("\n") + "```";
        };

        const rowButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('show_more').setLabel('Show 5 more').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('reverse').setLabel('Reverse').setStyle(ButtonStyle.Primary)
            );

        const rowSort = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('sort_by')
                    .setPlaceholder('Sort by')
                    .addOptions([
                        { label: 'Total Points', value: 'total_points' },
                        { label: 'Points/Game', value: 'points_per_game' },
                        { label: 'Price', value: 'now_cost' },
                        { label: 'TSB %', value: 'selected_by_percent' },
                        { label: 'Position', value: 'position' },
                    ])
            );

        const embed = new EmbedBuilder()
            .setTitle(`${team.name} - Squad`)
            .setColor(teamColors[team.name] || 0x1F8B4C)
            .setDescription(makePlayerList())
            .setThumbnail(`https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`)
            .addFields(
                { name: 'Total Points', value: `${players.reduce((sum, p) => sum + p.total_points, 0)}`, inline:true },
                { name: 'Total Value', value: `£${(players.reduce((sum, p) => sum + p.now_cost, 0) / 10).toFixed(1)}m`, inline:true }
            )
            .setFooter({ text: 'FPL Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
            .setTimestamp();

        const replyMsg = await interaction.reply({ embeds:[embed], components:[rowButtons, rowSort], fetchReply:true });
        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content:"This isn't for you!", ephemeral:true });

            if (i.isButton()) {
                if (i.customId === 'show_more') startIdx += pageSize;
                if (startIdx >= players.length) startIdx = 0;
                if (i.customId === 'reverse') {
                    players.reverse();
                    startIdx = 0;
                }
            }

            if (i.isStringSelectMenu()) {
                sortBy = i.values[0];
                sortPlayers();
                startIdx = 0;
            }

            embed.setDescription(makePlayerList());
            i.update({ embeds:[embed] });
        });
    }
    catch {
        console.error("Error in teamHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching FPL teams"});
        }  
    }

};
