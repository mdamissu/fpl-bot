const { fetchPlayerForm } = require("../../services/chartService");
const { execFile } = require("child_process");
const { fetchFPLData } = require("../../services/fplService");

module.exports = async function formHandler(interaction) {
    try {
        const playerName = interaction.options.getString("name");

        // map playerName -> playerId
        const data = await fetchFPLData();
        const player = data.elements.find(
            p => `${p.first_name} ${p.second_name}` === playerName
        );
        if (!player) 
            return interaction.reply({ content: "Player not found",});

        const formHistory = await fetchPlayerForm(player.id);
        if (!formHistory || formHistory.length === 0)
            return interaction.reply({ content: "No form history",});

        // Execute Python script
        execFile(
            "python",
            ["./handlers/chart/form_chart.py", playerName, JSON.stringify(formHistory)],
            (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: "Error generating chart",});
                }

                const imgBase64 = stdout.trim();
                const buffer = Buffer.from(imgBase64, "base64");

                interaction.reply({
                    files: [{ attachment: buffer, name: `${playerName}_form.png` }]
                });
            }
        );
    } catch (err) {
        console.error(err);
        interaction.reply({ content: "Error in fetching form data",});
    }
};
