const { getWatchlist } = require('../../services/watchService.js');

module.exports = async function viewHandler(interaction) {
    try {
        const players = await getWatchlist(interaction.user.id);

        if (!players || players.length === 0)
            return await interaction.reply({ content: "⚠️ Your watchlist is empty!", flags: 64 });

        // Build list
        const list = players.map((p, i) => {
            const deltaSign = (n) => n > 0 ? `+${n}` : `${n}`;
            return `${i+1}. **${p.name}** — ${p.team} — ${p.position}\n` +
                   `Pts: ${p.current.pts} (${deltaSign(p.delta.pts)}) | ` +
                   `PPM: ${p.current.ppm} (${deltaSign(p.delta.ppm)}) | ` +
                   `Price: £${p.current.price}m (${deltaSign(p.delta.price)}) | ` +
                   `TSB: ${p.current.tsb}% (${deltaSign(p.delta.tsb)})`;
        }).join("\n\n");

        await interaction.reply({ content: `📋 **Your Watchlist**\n\n${list}`, flags: 64 });
    } catch (err) {
        console.error("Error in viewHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({ content: "Error fetching watchlist"});
        }
    }
};
