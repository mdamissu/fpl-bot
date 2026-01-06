const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Server = require('../../models/serverModels');

module.exports = async function rankServerHandler(interaction) {
    try {
        const servers = await Server.find().populate('users');

        if (!servers || servers.length === 0) {
            return interaction.reply({ content: "No servers found.",});
        }

        // Get servers
        const serverRanks = servers.map(sv => {
            const totalPoints = sv.users.reduce(
                (sum, u) => sum + (u.totalPoints || 0),
                0
            );

            return {
                serverId: sv.serverId,
                name: sv.name || `Server ${sv.serverId}`,
                avgPoints: totalPoints/sv.users.length
            };
        });

        serverRanks.sort((a, b) => b.avgPoints - a.avgPoints);

        // Get Server rankings
        const curIndex = serverRanks.findIndex(
            s => s.serverId === interaction.guildId
        );
        const curServer = serverRanks[curIndex];

        // Build page (show user's server first)
        const pageSize = 5;
        let page = curIndex !== -1 ? Math.floor(curIndex / pageSize) : 0;
        const totalPages = Math.ceil(serverRanks.length / pageSize);

        const makeServerList = () => {
            const slice = serverRanks.slice(
                page * pageSize,
                page * pageSize + pageSize
            );

            const NAME_W  = 22;
            const PTS_W   = 10;
            const PLAY_W = 8;

            const header =
                "SERVER".padEnd(NAME_W) +
                "PLAYERS".padStart(PLAY_W) +
                "POINTS".padStart(PTS_W);

            const lines = slice.map((s, idx) => {
                const name = s.name.padEnd(NAME_W);
                const players = String(s.playerCount).padStart(PLAY_W);
                const pts = String(s.avgPoints).padStart(PTS_W);

                return `${name}${players}${pts}`;
            });

            return "```" +
                header + "\n" +
                "-".repeat(NAME_W + PLAY_W + PTS_W) +
                "\n" +
                lines.join("\n") +
                "```";
        };

        const embed = new EmbedBuilder()
            .setTitle("🌐 FPL Server Rankings")
            .setDescription(makeServerList())
            .setColor(0x1F8B4C)
            .addFields({
                name: "📍 Your Server",
                value: curServer
                    ? `**#${curIndex + 1}** with **${curServer.avgPoints} pts** (${curServer.playerCount} users)`
                    : "Your server is not ranked",
                inline: false
            })
            .setFooter({
                text: `Page ${page + 1}/${totalPages} • FPL Bot`
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('server_prev')
                .setLabel('⬅ Prev')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),

            new ButtonBuilder()
                .setCustomId('server_next')
                .setLabel('Next ➡')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1)
        );

        const msg = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({
                    content: "This menu is not for you.",
                    ephemeral: true
                });

            if (i.isButton()) {
                if (i.customId === 'server_next' && page < totalPages - 1) page++;
                if (i.customId === 'server_prev' && page > 0) page--;
            }

            embed.setDescription(makeServerList());

            row.components[0].setDisabled(page === 0);
            row.components[1].setDisabled(page === totalPages - 1);

            await i.update({
                embeds: [embed],
                components: [row]
            });
        });

        collector.on('end', async () => {
            msg.edit({ components: [] }).catch(() => {});
        });

    } catch (err) {
        console.error("Error rankServerHandler:", err);

        if (!interaction.replied) {
            await interaction.reply({
                content: "Error fetching server rankings.",
                ephemeral: true
            });
        }
    }
};
