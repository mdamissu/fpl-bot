const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const { fetchFPLData } = require('../../services/fplService');

module.exports = async function injuryHandler(interaction){
    try {
        await interaction.deferReply();

        const data = await fetchFPLData();
        // Get user input for team
        const clubFilter = interaction.options.getString("fc");

        if(!data || !data.elements || !data.elements.length || !data.teams)
            return interaction.editReply("No player or team data found.");

        const teamMap = new Map(data.teams.map(t => [t.id, t.name]));
        // Filter elements
        const filteredElements = clubFilter
            ? data.elements.filter(p => {
                const teamName = teamMap.get(p.team);
                return teamName?.toLowerCase().includes(clubFilter.toLowerCase());
            })
            : data.elements;
        
        // Filter injured players
        const injured = filteredElements
            .filter(p => p.status !== 'a')
            .map(p => ({
                name: `${p.first_name} ${p.second_name}`,
                status: p.status,
                chance: p.chance_of_playing_next_round ?? "N/A"
            }));

        if (!injured.length){
            return interaction.editReply("No injured or unavailable players found!");
        }

        const statusMap = {
            d: "🤕 Doubtful",
            i: "🚑 Injured",
            s: "🟥 Suspended",
            u: "❌ Unavailable"
        };

        // 5 players/page
        let startIdx = 0;
        const pageSize = 5;

        const makePage = () => {
            const slice = injured.slice(startIdx, startIdx + pageSize);
            return slice.map(p =>
                `**${p.name}** — ${statusMap[p.status] || "❓"} (${p.chance}% chance)`
            ).join("\n");
        };

        // Build embed + action row
        const embed = new EmbedBuilder()
            .setTitle("EPL Injury & Availability Report")
            .setColor(0xff0000)
            .setDescription(makePage())
            .setFooter({ 
                text:`Showing ${startIdx + 1}-${Math.min(startIdx + pageSize, injured.length)} of ${injured.length}` 
            });

        const rowButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⬅ Prev')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(startIdx === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next ➡')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(startIdx + pageSize >= injured.length)
            );

        const replyMsg = await interaction.editReply({
            embeds: [embed],
            components: [rowButtons],
            fetchReply: true
        });
        // Handle interactions via buttons by collector
        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({ content: "This isn't for you!", ephemeral: true });

            if (i.customId === 'next') {
                startIdx += pageSize;
                if (startIdx >= injured.length) startIdx = 0;
            } else if (i.customId === 'prev') {
                startIdx -= pageSize;
                if (startIdx < 0) startIdx = Math.max(0, injured.length - (injured.length % pageSize || pageSize));
            }

            embed.setDescription(makePage());
            embed.setFooter({
                text: `Showing ${startIdx + 1}-${Math.min(startIdx + pageSize, injured.length)} of ${injured.length}`
            });

            rowButtons.components[0].setDisabled(startIdx === 0);
            rowButtons.components[1].setDisabled(startIdx + pageSize >= injured.length);

            await i.update({ embeds: [embed], components: [rowButtons] });
        });

    } catch(err) {
        console.error(err);
        await interaction.editReply("Error getting injury data");
    }
};
