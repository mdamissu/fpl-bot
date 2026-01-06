const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { fetchTransfers } = require("../../services/transferService");

module.exports = async function transferHandler(interaction){
    try{
        await interaction.deferReply();
        
        // Get user input
        const clubFilter = interaction.options.getString("club");
        const transfers = await fetchTransfers();

        if(!transfers.length)
            return interaction.editReply("No transfer data found.");

        // Select transfers
        const filtered = clubFilter
            ? transfers.filter(t =>
                t.from?.toLowerCase().includes(clubFilter.toLowerCase()) ||
                t.to?.toLowerCase().includes(clubFilter.toLowerCase())
            )
            : transfers;

        if(!filtered.length)
            return interaction.editReply(`No transfers found for **${clubFilter}**`);

        // Build page
        let idx = 0;
        const pageSize = 5;

        const makePage = () => {
            const slice = filtered.slice(idx, idx + pageSize);

            return slice.map((t,i)=>(
                `**${idx + i + 1}. ${t.player}**\n`+
                `🔁 **${t.type}**\n`+
                `➡️ From: ${t.from || "Unknown"}\n`+
                `🏠 To: ${t.to || "Unknown"}`
            )).join("\n\n");
        };

        // Build embed, action rows, buttons, collector
        const embed = new EmbedBuilder()
            .setTitle("🔄 EPL Transfer Updates")
            .setColor(0x00ff99)
            .setDescription(makePage())
            .setFooter({
                text: `Showing ${idx+1}-${Math.min(idx+pageSize, filtered.length)} of ${filtered.length}`
            });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next 5")
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await interaction.editReply({
            embeds:[embed],
            components:[row],
            fetchReply:true
        });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async i => {

            if(i.user.id !== interaction.user.id)
                return i.reply({ content:"This button isn't for you!", ephemeral:true });

            if(i.customId === "next"){
                idx += pageSize;
                if(idx >= filtered.length) idx = 0;
            }

            embed
                .setDescription(makePage())
                .setFooter({
                    text: `Showing ${idx+1}-${Math.min(idx+pageSize, filtered.length)} of ${filtered.length}`
                });

            await i.update({ embeds:[embed] });

        });

    }catch(err){
        console.error(err);
        await interaction.editReply("Error getting transfer data");
    }
};
