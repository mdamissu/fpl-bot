const { fetchFPLData } = require('../../services/fplService');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = async function topHandler(interaction) {
    try {
        const data = await fetchFPLData();
        const count = interaction.options.getInteger('count') || 5;

        // Build page
        const players = [...data.elements];
        let sortBy = 'total_points';
        let reversed = false;
        let filterBy = 'none';

        const sortPlayers = () => {
            players.sort((a, b) => {
                let valA, valB;

                switch (sortBy) {
                    case 'total_points': valA = a.total_points; valB = b.total_points; break;
                    case 'points_per_game': valA = parseFloat(a.points_per_game); valB = parseFloat(b.points_per_game); break;
                    case 'now_cost': valA = a.now_cost; valB = b.now_cost; break;
                    case 'selected_by_percent': valA = parseFloat(a.selected_by_percent); valB = parseFloat(b.selected_by_percent); break;
                    case 'ict_idx': valA = parseFloat(a.ict_index); valB = parseFloat(b.ict_index); break;
                    case 'round_points': valA = a.event_points; valB = b.event_points; break;
                    case 'transfers_in': valA = a.transfers_in_event; valB = b.transfers_in_event; break;
                    case 'transfers_out': valA = a.transfers_out_event; valB = b.transfers_out_event; break;
                    default: valA = 0; valB = 0;
                }

                return valB - valA;
            });

            if (reversed) players.reverse();
        };

        // Make player list
        const makePlayerList = () => {
            let filtered = players;
            if (filterBy !== 'none') {
                const typeMap = { gk: 1, df: 2, mf: 3, cf: 4 };
                filtered = players.filter(p => p.element_type === typeMap[filterBy]);
            }

            return filtered
                .slice(0, count)
                .map((p, i) => {
                    const team = data.teams.find(t => t.id === p.team);
                    const pos = data.element_types[p.element_type - 1].singular_name;

                    let value;
                    switch (sortBy) {
                        case 'total_points': value = p.total_points; break;
                        case 'points_per_game': value = parseFloat(p.points_per_game).toFixed(1); break;
                        case 'now_cost': value = (p.now_cost / 10).toFixed(1) + 'm'; break;
                        case 'selected_by_percent': value = parseFloat(p.selected_by_percent).toFixed(1) + '%'; break;
                        case 'ict_idx': value = parseFloat(p.ict_index).toFixed(1); break;
                        case 'round_points': value = p.event_points; break;
                        case 'transfers_in': value = p.transfers_in_event; break;
                        case 'transfers_out': value = p.transfers_out_event; break;
                        default: value = p.total_points;
                    }

                    return `**${i + 1}. ${p.web_name}** (${pos} - ${team.name}) - ${value}`;
                })
                .join('\n');
        };

        const rowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reverse').setLabel('Reverse').setStyle(ButtonStyle.Primary)
        );

        const rowSort = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('sort_by')
                .setPlaceholder('Sort by')
                .addOptions([
                    { label: 'Total Points', value: 'total_points' },
                    { label: 'Points/Game', value: 'points_per_game' },
                    { label: 'Price', value: 'now_cost' },
                    { label: 'TSB %', value: 'selected_by_percent' },
                    { label: 'ICT index', value: 'ict_idx' },
                    { label: 'Round Points', value: 'round_points' },
                    { label: 'Transfers In', value: 'transfers_in' },
                    { label: 'Transfers Out', value: 'transfers_out' },
                ])
        );

        const rowFilter = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('filter_by')
                .setPlaceholder('Filter by position')
                .addOptions([
                    { label: 'None', value: 'none' },
                    { label: 'Goalkeepers', value: 'gk' },
                    { label: 'Defenders', value: 'df' },
                    { label: 'Midfielders', value: 'mf' },
                    { label: 'Forwards', value: 'cf' },
                ])
        );

        sortPlayers();

        const embed = new EmbedBuilder()
            .setTitle(`Top ${count} FPL Players`)
            .setColor(0xFFD700)
            .setDescription(makePlayerList())
            .setFooter({ text: 'FPL Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
            .setTimestamp();

        const replyMsg = await interaction.reply({
            embeds: [embed],
            components: [rowButtons, rowSort, rowFilter],
            fetchReply: true
        });

        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id)
                return i.reply({ content: "This isn't for you!", ephemeral: true });

            if (i.isButton() && i.customId === 'reverse') reversed = !reversed;
            if (i.isStringSelectMenu()) {
                if (i.customId === 'sort_by') sortBy = i.values[0];
                if (i.customId === 'filter_by') filterBy = i.values[0];
            }

            sortPlayers();
            embed.setDescription(makePlayerList());
            await i.update({ embeds: [embed], components: [rowButtons, rowSort, rowFilter] });
        });
    }
    catch {
        console.error("Error in topHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching top players"});
        } 
    }

};
