const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MyTeam = require('../../models/userModels');
const Server = require('../../models/serverModels');

module.exports = async function rankHandler(interaction) {
    try {
        const data = await Server.findOne({ serverId: interaction.guildId }).populate('users');
        if (!data || !data.users || data.users.length === 0) {
            return interaction.reply({ content: "No FPL users linked in this server.", ephemeral: true });
        }

        // Sort users by totalPoints descending
        const users = data.users.sort((a, b) => b.totalPoints - a.totalPoints);

        // Find current user's index
        const curIndex = users.findIndex(u => u.discordId === interaction.user.id);
        const curUser = users[curIndex];

        // Determine page where current user is
        const pageSize = 5;
        let page = Math.floor(curIndex / pageSize); 
        const totalPages = Math.ceil(users.length / pageSize);

        const makeUserList = () => {
            const slice = users.slice(page * pageSize, page * pageSize + pageSize);

            const NAME_W = 20;
            const ENTRY_W = 8;
            const PTS_W = 6;
            const RANK_W = 6;
            const GWPTS_W = 6;
            const GWRANK_W = 6;
            const REGION_W = 10;
            const UPDATED_W = 16;

            const header =
                "NAME".padEnd(NAME_W) +
                "ENTRY".padEnd(ENTRY_W) +
                "PTS".padStart(PTS_W) +
                "RANK".padStart(RANK_W) +
                "GWPTS".padStart(GWPTS_W) +
                "GWRK".padStart(GWRANK_W) +
                "REGION".padEnd(REGION_W) +
                "UPDATED".padStart(UPDATED_W);

            const lines = slice.map((u, idx) => {
                const name = u.handle.padEnd(NAME_W);
                const entry = String(u.entryId).padEnd(ENTRY_W);
                const points = String(u.totalPoints).padStart(PTS_W);
                const rank = String(u.overallRank).padStart(RANK_W);
                const gwPts = String(u.eventPoints).padStart(GWPTS_W);
                const gwRank = String(u.eventRank).padStart(GWRANK_W);
                const region = (u.region || "").padEnd(REGION_W);
                const updated = u.updatedAt ? u.updatedAt.toISOString().slice(0, 16) : "N/A";
                return `${name}${entry}${points}${rank}${gwPts}${gwRank}${region}${updated.padStart(UPDATED_W)}`;
            });

            return "```" + header + "\n" + "-".repeat(NAME_W + ENTRY_W + PTS_W + RANK_W + GWPTS_W + GWRANK_W + REGION_W + UPDATED_W) + "\n" + lines.join("\n") + "```";
        };

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name} — FPL Server Rankings`)
            .setDescription(makeUserList())
            .setColor(0x1F8B4C)
            .addFields({
                name: "📍 Your Position",
                value: curUser
                    ? `You are ranked **#${curIndex + 1}** in this **${users.length}**-player server  with **${curUser.totalPoints} pts**`
                    : "You are not on the ranking list",
                inline: false
            })
            .setFooter({ text: `Page ${page + 1}/${totalPages} • FPL Bot`, iconURL: 'https://i.imgur.com/AfFp7pu.png' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('rank_prev').setLabel('⬅ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('rank_next').setLabel('Next ➡').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
            );

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: "This menu is not for you.", ephemeral: true });

            if (i.isButton()) {
                if (i.customId === 'rank_next' && page < totalPages - 1) page++;
                if (i.customId === 'rank_prev' && page > 0) page--;
            }

            embed.setDescription(makeUserList());
            row.components[0].setDisabled(page === 0);
            row.components[1].setDisabled(page === totalPages - 1);

            await i.update({ embeds: [embed], components: [row] });
        });

        collector.on('end', async () => {
            msg.edit({ components: [] }).catch(() => {});
        });

    } catch (err) {
        console.error("Error in rankHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching FPL server rankings."});
        }
    }
};
