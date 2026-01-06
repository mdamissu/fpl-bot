const { SlashCommandBuilder } = require('discord.js');

/* /notify: Notify for changes in stats: goal_scored, assists, penalties_missed, penalty_saved, yellow_cards, red_cards, deadline_time,
fixture_removed, standings, injury, price
    sub: Add a category to subscriptions list
    rm: Remove a category from subscriptions list
    see: View subscriptions list 
*/ 
const subHandler = require('../../handlers/notify/subHandler');
const rmHandler = require('../../handlers/notify/rmHandler');
const seeHandler = require('../../handlers/notify/seeHandler');


const notificationsList = [
    { name: "Goals", value: "goals_scored" },
    { name: "Assists", value: "assists" },
    { name: "Penalty Missed", value: "penalties_missed" },
    { name: "Penalty Saved", value: "penalties_saved" },
    { name: "Yellow Card", value: "yellow_cards" },
    { name: "Red Card", value: "red_cards" },
    { name: "Deadline", value: "deadline_time" },
    { name: "Fixture Removed", value: "fixture_removed" },
    { name: "EPL Standings", value: "standings" },
    { name: "Injuries", value: "injury" },
    { name: "Price change", value: "price"}
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('Subscribe to latest FPL notifications')
        .addSubcommand(subcommand =>
            subcommand
                .setName('sub')
                .setDescription('Add to your subscription')
                .addStringOption(option =>
                    option
                        .setName('stat')
                        .setDescription('Notification type')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rm')
                .setDescription('Remove from your subscriptions')
                .addStringOption(option =>
                    option
                        .setName('stat')
                        .setDescription('Notification type')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('see')
                .setDescription('View your subscriptions')
        ),

    /**
     * AUTOCOMPLETE
     */
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused().toLowerCase();

            const filtered = notificationsList
                .filter(item =>
                    item.name.toLowerCase().includes(focusedValue)
                )
                .slice(0, 25);

            await interaction.respond(
                filtered.map(item => ({
                    name: item.name,
                    value: item.value
                }))
            );
        } catch (err) {
            console.error("Autocomplete error:", err);
        }
    },

    /**
     * COMMAND EXECUTION
     */
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'sub') {
                await subHandler(interaction);
            }
            else if (subcommand === 'rm') {
                await rmHandler(interaction);
            }
            else if (subcommand === 'see') {
                await seeHandler(interaction);
            }
        }
        catch (err) {
            console.error("Command error:", err);

            if (!interaction.replied) {
                await interaction.reply({
                    content: "Error handling notification command",
                    ephemeral: true
                });
            }
        }
    }
};
