const { SlashCommandBuilder } = require('discord.js');
/* /fpl: Show FPL Stats for a given team/player:
    player: Show info about a player
    team: Show info about a team
    compare: Compare 2 player
    top: Show top FPL players
    ldb: Show leaderboard for any FPL League
    dream: Show FPL Dreamteam for each GW
    solo: Compare 2 FPL managers
    potw: Show FPL POTWs for each GW
*/
const playerHandler = require('../../handlers/fpl/playerHandler');
const teamHandler = require('../../handlers/fpl/teamHandler');
const compareHandler = require('../../handlers/fpl/compareHandler');
const topHandler = require('../../handlers/fpl/topHandler');
const ldbHandler = require('../../handlers/fpl/ldbHandler');
const dreamHandler = require('../../handlers/fpl/dreamHandler');
const soloHandler = require('../../handlers/fpl/soloHandler');
const potwHandler = require('../../handlers/fpl/potwHandler');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fpl')
        .setDescription('FPL info command')
        .addSubcommand(sub =>
            sub.setName('player')
               .setDescription('Show info about a player')
               .addStringOption(option =>
                    option.setName('name')
                          .setDescription('Player name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('team')
               .setDescription('Show info about a team')
               .addStringOption(option =>
                    option.setName('team')
                          .setDescription('Team name')
                          .setRequired(true)
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('top')
               .setDescription('Show top players')
               .addIntegerOption(option =>
                    option.setName('count')
                          .setDescription('Number of top players to show (default 10)')
                          .setRequired(false)
                          .setMinValue(1)
                          .setMaxValue(25)))
        .addSubcommand(sub =>
            sub.setName('compare')
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
                          .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName('solo')
               .setDescription('Compare 2 FPL players')
               .addIntegerOption(option =>
                    option.setName('user1')
                          .setDescription('First user')
                          .setRequired(true))
               .addIntegerOption(option =>
                    option.setName('user2')
                          .setDescription('Second user')
                          .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('ldb')
                .setDescription('Show FPL leagues Leaderboard')
                .addStringOption(option =>
                    option.setName('league_id')
                        .setDescription('FPL League ID')
                ))
        .addSubcommand(sub =>
            sub.setName('dream')
                .setDescription('Show GW dreamteam'))
        .addSubcommand(sub =>
            sub.setName('potw')
                .setDescription('Show POTW of the GW'))
        .addSubcommand(sub =>
            sub.setName('svldb')
                .setDescription('Show server total verified points and rankings')
        ),
    async autocomplete(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const { fetchFPLData } = require('../../services/fplService');
        const data = await fetchFPLData();

        if (subcommand === 'player' || subcommand === 'compare') {
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

            if (subcommand === 'player') await playerHandler(interaction);
            else if (subcommand === 'team') await teamHandler(interaction);
            else if (subcommand === 'compare') await compareHandler(interaction);
            else if (subcommand === 'top') await topHandler(interaction);
            else if (subcommand === 'ldb') await ldbHandler(interaction);
            else if (subcommand === 'dream') await dreamHandler(interaction);
            else if (subcommand === 'solo') await soloHandler(interaction);
            else if (subcommand === 'potw') await potwHandler(interaction);
            else if (subcommand === 'svldb') await svldbHandler(interaction);

        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: "Error fetching data", ephemeral: true });
            }
        }
    },
};
