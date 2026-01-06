const { SlashCommandBuilder } = require('discord.js');
/* [Ongoing]: Predict FPL player/team/EPL player stats
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('predict')
        .setDescription('Predict EPL Player/User stats')
        .addSubcommand(sub =>
            sub.setName('player')
               .setDescription('Shiw predictions about a player')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('team')
               .setDescription('Show predictions about a team')
               .addStringOption(option =>
                    option.setName('team')
                          .setDescription('Team name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('myteam')
               .setDescription('Show predictions about myteam')),
    async autocomplete(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const { fetchFPLData } = require('../../services/fplService');
        const data = await fetchFPLData();

        if (subcommand === 'player') {
            const choices = data.elements.map(p => p.first_name + " " + p.second_name);
            const filtered = choices.filter(p => p.toLowerCase().includes(focusedValue)).slice(0, 25);
            await interaction.respond(filtered.map(p => ({ name: p, value: p })));
        } else if (subcommand === 'team') {
            const choices = data.teams.map(t => t.name);
            const filtered = choices.filter(t => t.toLowerCase().includes(focusedValue)).slice(0, 25);
            await interaction.respond(filtered.map(t => ({ name: t, value: t })));
        }
    },

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
