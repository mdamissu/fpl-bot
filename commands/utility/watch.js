const { SlashCommandBuilder } = require('discord.js');
/* /watch:
    add: Add a player to watchlist
    delete: Delete a player from watchlist
    view: View watchlist
*/
const addHandler = require('../../handlers/watch/addHandler');
const deleteHandler = require('../../handlers/watch/deleteHandler');
const viewHandler = require('../../handlers/watch/viewHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('watch')
        .setDescription('Manage your FPL watchlist')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a player to your watchlist')
                .addStringOption(option =>
                    option
                        .setName('player')
                        .setDescription('Player name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a player from your watchlist')
                .addStringOption(option =>
                    option
                        .setName('player')
                        .setDescription('Player name or ID')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your watchlist')
        ),

    async autocomplete(interaction) {
        try {
            const focused = interaction.options.getFocused(true);
            const focusedValue = focused.value.toLowerCase();

            if (focused.name === 'player') {
                const { fetchFPLData } = require('../../services/fplService');
                const data = await fetchFPLData();

                const choices = data.elements.map(p => p.first_name + " " + p.second_name);

                const filtered = choices
                    .filter(name => name.toLowerCase().includes(focusedValue))
                    .slice(0, 25);

                await interaction.respond(
                    filtered.map(name => ({ name, value: name }))
                );
            }
            else return;

        } catch (err) {
            console.error("Autocomplete error:", err);
        }
    },

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                await addHandler(interaction);
            }
            else if (subcommand === 'delete') {
                await deleteHandler(interaction);
            }
            else if (subcommand === 'view') {
                await viewHandler(interaction);
            }
        }
        catch (err) {
            console.error("Command error:", err);

            if (!interaction.replied) {
                await interaction.reply({
                    content: "Error fetching watchlist",
                    ephemeral: true,
                });
            }
        }
    }
};
