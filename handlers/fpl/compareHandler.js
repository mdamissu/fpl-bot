const { fetchFPLData } = require('../../services/fplService');
const { generateCompareCanvas } = require('../../canvas/compareCanvas');

module.exports = async function compareHandler(interaction) {
    const data = await fetchFPLData();

    // Get user input
    const name1 = interaction.options.getString('player1').toLowerCase();
    const name2 = interaction.options.getString('player2').toLowerCase();

    // map playerName -> JSON
    const player1 = data.elements.find(p => (p.first_name + " " + p.second_name).toLowerCase() === name1);
    const player2 = data.elements.find(p => (p.first_name + " " + p.second_name).toLowerCase() === name2);

    if (!player1 || !player2) return await interaction.reply({ content: 'One or both players not found!', ephemeral: true });

    const buffer = await generateCompareCanvas(player1, player2, data);

    await interaction.reply({
        files: [{ attachment: buffer, name: 'compare.png' }]
    });
};
