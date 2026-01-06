const { SlashCommandBuilder } = require('discord.js');

/* /epl: Show EPL stats:
    peak: Top scorers, playmakers
    transfer: Transfer updates
    live: : Live updates
    injury: Injury updates
    h2h: Compare 2 clubs
*/
const peakHandler = require('../../handlers/epl/peakHandler');
const transferHandler = require('../../handlers/epl/transferHandler');
const injuryHandler = require('../../handlers/epl/injuryHandler');
const liveHandler = require('../../handlers/epl/liveHandler');
const h2hHandler = require('../../handlers/epl/h2hHandler');
const versusHandler = require('../../handlers/epl/versusHandler');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('epl')
        .setDescription('Show top scorers and assists')
        .addSubcommand(sub =>
            sub.setName('peak')
               .setDescription('Show top 5 scorers and assists'))
        .addSubcommand(sub =>
            sub.setName('transfer')
            .setDescription('Show transfer updates')
            .addStringOption(opt =>
                opt.setName('club')
                    .setDescription('Club transfers')
                    .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('injury')
               .setDescription('Show injuries info')
                .addStringOption(opt =>
                    opt.setName('fc')
                        .setDescription('Club transfers')
                        .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('live')
               .setDescription('Show live standings'))
        .addSubcommand(sub =>
            sub.setName('h2h')
               .setDescription('Compare 2 clubs')
               .addStringOption(option =>
                    option.setName('club1')
                          .setDescription('First club')
                          .setRequired(true)
                          .setAutocomplete(true))
               .addStringOption(option =>
                    option.setName('club2')
                          .setDescription('Second club')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('versus')
               .setDescription('Compare 2 players')
               .addStringOption(option =>
                    option.setName('player1')
                          .setDescription('First player')
                          .setRequired(true)
                          .setAutocomplete(true))
               .addStringOption(option =>
                    option.setName('player2')
                          .setDescription('Second player')
                          .setRequired(true)
                          .setAutocomplete(true))),    
        async autocomplete(interaction) {
            const subcommand = interaction.options.getSubcommand();
            const focusedValue = interaction.options.getFocused().toLowerCase();
            const { fetchFPLData } = require('../../services/fplService');
            const data = await fetchFPLData();
            if (subcommand === 'versus') {
                const choices = data.elements.map(p => p.first_name + " " + p.second_name);
                const filtered = choices.filter(p => p.toLowerCase().includes(focusedValue)).slice(0, 25);
                await interaction.respond(filtered.map(p => ({ name: p, value: p })));
            } else if (subcommand === 'h2h' || subcommand === 'transfer' || subcommand === 'injury') {
                const choices = data.teams.map(t => t.name);
                const filtered = choices.filter(t => t.toLowerCase().includes(focusedValue)).slice(0, 25);
                await interaction.respond(filtered.map(t => ({ name: t, value: t })));
        }
    },

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'peak') await peakHandler(interaction);
            else if (subcommand === 'transfer') await transferHandler(interaction);
            else if (subcommand === 'injury') await injuryHandler(interaction);
            else if (subcommand === 'live') await liveHandler(interaction);
            else if (subcommand === 'h2h') await h2hHandler(interaction);
            else if (subcommand === 'versus') await versusHandler(interaction);

        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: "Error fetching data", ephemeral: true });
            }
        }
    },
};
