const { SlashCommandBuilder } = require('discord.js');
// [Ongoing] : FPL minigames for Discord servers
module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Play FPL Bot games'),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: "Error fetching data", ephemeral: true });
            }
        }
    },
};
