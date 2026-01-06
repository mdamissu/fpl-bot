const { SlashCommandBuilder } = require('discord.js');
/* /myteam: Show FPL stats for a given FPL manager
    set: Set a new saved handle
    squad: Current squad of saved handle
    history: GW history of saved handle 
    confirm: Confirm setting FPL handle
    rank: Server FPL rankings
*/
const historyHandler = require('../../handlers/myteam/historyHandler');
const setHandler = require('../../handlers/myteam/setHandler');
const squadHandler = require('../../handlers/myteam/squadHandler');
const rankHandler = require('../../handlers/myteam/rankHandler');
const confirmHandler = require('../../handlers/myteam/confirmHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('myteam')
        .setDescription('FPL info command')
        .addSubcommand(sub =>
        sub.setName('set')
            .setDescription('Save your FPL entry id')
            .addIntegerOption(option =>
                option.setName('entry_id')
                    .setDescription('Your FPL Entry ID')
                    .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('squad')
               .setDescription('Show your squad'))
        .addSubcommand(sub =>
            sub.setName('history')
               .setDescription('Show your past GW results'))
        .addSubcommand(sub =>
            sub.setName('confirm')
                .setDescription('Confirm your handle'))
        .addSubcommand(sub =>
            sub.setName('rank')
                .setDescription('Show server FPL rankings')),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'set') await setHandler(interaction);
            else if (subcommand === 'squad') await squadHandler(interaction);
            else if (subcommand === 'history') await historyHandler(interaction);
            else if (subcommand === 'rank') await rankHandler(interaction);
            else if (subcommand === 'confirm') await confirmHandler(interaction);

        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: "Error fetching your team", ephemeral: true });
            }
        }
    },
};
