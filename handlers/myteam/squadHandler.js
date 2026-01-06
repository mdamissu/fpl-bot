const MyTeam = require('../../models/userModels');
const { fetchSquad } = require('../../services/myteamService');
const { fetchFPLData } = require('../../services/fplService');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { teamColors } = require('../../canvas/compareCanvas');

module.exports = async function squadHandler(interaction){
    try{
        await interaction.deferReply({ ephemeral: true });

        const myteam = await MyTeam.findOne({ discordId: interaction.user.id });
        if(!myteam)
            return interaction.editReply("You haven't set your team yet. Use `/myteam set <id>`");

        // Get squad
        const squad = await fetchSquad(myteam.entryId);
        if(!squad || squad.length === 0)
            return interaction.editReply("No squad data found.");

        // Build page
        const data = await fetchFPLData();
        let currentGW = squad.length - 1;
        const pageSize = 11;

        const makeSquadList = (gwIndex) => {
            const picks = squad[gwIndex].picks;
            const W_NAME = 15, W_POS = 10, W_PTS = 5, W_RPTS = 5, W_PRICE = 7, W_TSB = 6;

            const lines = picks.map(p => {
                const player = data.elements.find(e => e.id === p.element);
                if(!player) return '';

                const name = player.web_name.slice(0, W_NAME).padEnd(W_NAME);
                const pos = data.element_types[player.element_type - 1].singular_name.slice(0, W_POS).padEnd(W_POS);
                const pts = String(player.total_points).padStart(W_PTS);
                const rpts = String(player.event_points || 0).padStart(W_RPTS);
                const price = ((player.now_cost / 10).toFixed(1)).padStart(W_PRICE);
                const tsb = (Number(player.selected_by_percent).toFixed(1) + "%").padStart(W_TSB);
                return `${name}|${pos}|${pts}|${rpts}|${price}|${tsb}`;
            });

            return "```" +
                   "PLAYER          |POSITION  |PTS  |GW PTS|PRICE  |TSB%\n" +
                   "---------------+----------+-----+------+-------+------\n" +
                   lines.join("\n") + "```";
        };

        const rowButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('last').setLabel('View Earlier GW').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('next').setLabel('View Next GW').setStyle(ButtonStyle.Primary)
            );

        const embed = new EmbedBuilder()
            .setTitle(`${myteam.handle} - GW ${currentGW + 1}`)
            .setColor(0x1F8B4C)
            .setDescription(makeSquadList(currentGW))
            .setFooter({ text: 'FPL Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
            .setTimestamp();

        const replyMsg = await interaction.editReply({ embeds:[embed], components:[rowButtons], fetchReply:true });
        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.fuser.id !== interaction.user.id)
                return i.reply({ content: "This isn't for you!", ephemeral: true });

            if (i.isButton()) {
                if(i.customId === 'last' && currentGW > 0) currentGW--;
                if(i.customId === 'next' && currentGW < squad.length - 1) currentGW++;
            }

            embed.setTitle(`${myteam.teamName} - GW ${currentGW + 1}`);
            embed.setDescription(makeSquadList(currentGW));
            await i.update({ embeds:[embed], components:[rowButtons] });
        });

    } catch(err){
        console.error("Error in squadHandler", err);
        await interaction.editReply("Error loading squad");
    }
};
