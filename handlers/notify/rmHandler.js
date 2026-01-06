const Notification = require('../../models/notificationsModels');

module.exports = async function rmHandler(interaction) {
    try{
        const stat = interaction.options.getString('stat');
        const discordId = interaction.user.id;

        // find userid
        const doc = await Notification.findOne({ discordId });

        if (!doc || doc[stat] === false) {
            return interaction.reply({
                content: `❗ You are not subscribed to **${stat}**`,
                ephemeral: true,
            });
        }

        doc[stat] = false;
        await doc.save();

        return interaction.reply({
            content: `🗑️ Unsubscribed from **${stat}**`,
        });
    }
    catch{
        console.error("Error in rmHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Error removing subscription",
            });
        }
    }
};





