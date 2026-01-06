const { removeFromWatchlist } = require('../../services/watchService.js');

module.exports = async function deleteHandler(interaction) {
    try {
        const playerName = interaction.options.getString('player');

        const removed = await removeFromWatchlist(interaction.user.id, playerName);

        if (!removed) {
            return await interaction.reply({
                content: `⚠️ Player **${playerName}** is not in your watchlist.`,
                flags: 64
            });
        }

        await interaction.reply({
            content: `✅ Removed **${playerName}** from your watchlist!`,
            flags: 64
        });

    } catch (err) {
        console.error("Error in deleteHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Error removing from watchlist",
            });
        }
    }
};
