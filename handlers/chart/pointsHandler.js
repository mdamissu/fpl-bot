const { fetchPlayerPoints } = require("../../services/chartService");
const { execFile } = require("child_process");

module.exports = async function pointsHandler(interaction) {
    try {
        const playerName = interaction.options.getString("name");

        // map playerName -> playerId 
        const { fetchFPLData } = require("../../services/fplService");
        const data = await fetchFPLData();
        const player = data.elements.find(p => `${p.first_name} ${p.second_name}` === playerName);
        if (!player) return interaction.reply({ content: "Can not find player",});

        const points = await fetchPlayerPoints(player.id);
        if (!points || points.length === 0)
            return interaction.reply({ content: "No points history",});

        // Execute Python script
        execFile("python", ["./handlers/chart/points_chart.py", playerName, JSON.stringify(points)], (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: "Error generating chart",});
            }

            const imgBase64 = stdout.trim();
            const buffer = Buffer.from(imgBase64, "base64");

            interaction.reply({
                files: [{ attachment: buffer, name: `${playerName}_points.png` }]
            });
        });
    }
    catch (err){
        console.error(err);
        interaction.reply({ content: "Error in fetching points data",});
    }

};
