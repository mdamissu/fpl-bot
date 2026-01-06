const { addToWatchlist } = require('../../services/watchService.js');

module.exports = async function addHandler(interaction) {
    try {
        const playerName = interaction.options.getString('player');

        const added = await addToWatchlist(interaction.user.id, playerName);

        if (!added) {
            return await interaction.reply({
                content: `⚠️ Player **${playerName}** is already in your watchlist.`,
                flags: 64
            });
        }

        await interaction.reply({
            content: `✅ Added **${playerName}** to your watchlist!`,
            flags: 64
        });
    } catch (err) {
        console.error("Error in addHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Error adding to watchlist",
            });
        }
    }
};
