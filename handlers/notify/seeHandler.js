const Notification = require('../../models/notificationsModels');
const notificationsList = require('../../constants/notifications');

module.exports = async function seeHandler(interaction) {
    try {
        const discordId = interaction.user.id;
        const doc = await Notification.findOne({ discordId });

        if (!doc) {
            return interaction.reply({
                content: '📭 You have no subscriptions',
                ephemeral: true,
            });
        }

        // Get notifications list
        const active = notificationsList
            .filter(item => doc[item.value] === true)
            .map(item => `• ${item.key}`);

        if (active.length === 0) {
            return interaction.reply({
                content: '📭 You have no active subscriptions',
                ephemeral: true,
            });
        }

        return interaction.reply({
            content: `📌 **Your subscriptions:**\n${active.join('\n')}`,
        });
    }
    catch {
        console.error("Error in seeHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Error showing subscriptions",
            });
        }   
    }

};

