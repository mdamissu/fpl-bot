const Notification = require('../../models/notificationsModels');

module.exports = async (interaction) => {
    try {
        const stat = interaction.options.getString('stat');
        const discordId = interaction.user.id;
        // Get userid
        let doc = await Notification.findOne({ discordId });

        if (!doc) {
            doc = await Notification.create({ discordId });
        }

        if (doc[stat] === true) {
            return interaction.reply({
                content: `❗ You already subscribed to **${stat}**`,
                ephemeral: true,
            });
        }

        doc[stat] = true;
        await doc.save();

        return interaction.reply({
            content: `✅ Subscribed to **${stat}**`,
        });
    }
    catch {
        console.error("Error in subHandler:", err);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Error adding subscription",
            });
        }
    }

};

