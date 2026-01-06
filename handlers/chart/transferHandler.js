const { fetchPlayerTransfers } = require("../../services/chartService");
const { execFile } = require("child_process");
const { fetchFPLData } = require("../../services/fplService");

module.exports = async function transferHandler(interaction) {
    try {
        const playerName = interaction.options.getString("name");

        // map playerName -> playerId (fetchFPLData)
        const data = await fetchFPLData();
        const player = data.elements.find(p => `${p.first_name} ${p.second_name}` === playerName);
        if (!player) return interaction.reply({ content: "Player not found",});

        const transfers = await fetchPlayerTransfers(player.id);
        if (!transfers || transfers.length === 0)
            return interaction.reply({ content: "No transfer history",});

        // Execute Python script
        execFile("python", ["./handlers/chart/transfer_chart.py", playerName, JSON.stringify(transfers)], (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: "Error generating chart",});
            }

            const imgBase64 = stdout.trim();
            const buffer = Buffer.from(imgBase64, "base64");

            interaction.reply({
                files: [{ attachment: buffer, name: `${playerName}_transfers.png` }]
            });
        });
    }
    catch (err){
        console.error(err);
        interaction.reply({ content: "Error in fetching transfers data",});    
    }

};
