const { execFile } = require("child_process");
const { fetchFPLData } = require("../../services/fplService");
const { getPlayerPointsRank } = require("../../services/chartService");

module.exports = async function pointsRankHandler(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
        const playerName = interaction.options.getString("name");

        const data = await fetchFPLData();
        const player = data.elements.find(
            p => `${p.first_name} ${p.second_name}`.toLowerCase() === playerName.toLowerCase()
        );

        if (!player)
            return interaction.editReply("❌ Player not found");

        const ranks = getPlayerPointsRank(player.id);
        if (!ranks || ranks.length === 0)
            return interaction.editReply("❌ No points rank data");

        execFile(
            "python",
            ["./handlers/chart/points_rank.py", playerName, JSON.stringify(ranks)],
            async (err, stdout) => {
                if (err) {
                    console.error(err);
                    return interaction.editReply("❌ Error generating chart");
                }

                const buffer = Buffer.from(stdout.trim(), "base64");
                await interaction.editReply({
                    files: [{ attachment: buffer, name: `${playerName}_points_rank.png` }]
                });
            }
        );

    } catch (err) {
        console.error(err);
        await interaction.editReply("Error in fetching form data");
    }
};
