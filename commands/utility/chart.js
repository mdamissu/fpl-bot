const { SlashCommandBuilder } = require('discord.js');

// /chart: Show charts for these following stats of a given player: form, form-rank, transfer, transfer-rank, points, points-rank
const formHandler = require('../../handlers/chart/formHandler');
const pointsHandler = require('../../handlers/chart/pointsHandler');
const transferHandler = require('../../handlers/chart/transferHandler');
const formRankHandler = require('../../handlers/chart/formRankHandler');
const pointsRankHandler = require('../../handlers/chart/pointsRankHandler');
const transferRankHandler = require('../../handlers/chart/transferRankHandler');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('chart')
        .setDescription('Show chart and analytics of a FPL player')
        .addSubcommand(sub =>
            sub.setName('form')
               .setDescription('Show player form chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('points')
               .setDescription('Show player points chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('transfer')
               .setDescription('Shpw player transfer chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))        
        .addSubcommand(sub =>
            sub.setName('form-rank')
               .setDescription('Show form rank chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('points-rank')
               .setDescription('Show points rank chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('transfer-rank')
               .setDescription('Showt transfer rank chart')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true))),
    async autocomplete(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const { fetchFPLData } = require('../../services/fplService');
        const data = await fetchFPLData();
        const choices = data.elements.map(p => p.first_name + " " + p.second_name);
        const filtered = choices.filter(p => p.toLowerCase().includes(focusedValue)).slice(0, 25);
        await interaction.respond(filtered.map(p => ({ name: p, value: p })));

    },

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'form') await formHandler(interaction);
            else if (subcommand === 'points') await pointsHandler(interaction);
            else if (subcommand === 'transfer') await transferHandler(interaction);
            else if (subcommand === 'form-rank') await formRankHandler(interaction);
            else if (subcommand === 'points-rank') await pointsRankHandler(interaction);
            else if (subcommand === 'transfer-rank') await transferRankHandler(interaction);

        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: "Error fetching data", ephemeral: true });
            }
        }
    },
};
