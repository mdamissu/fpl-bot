const { 
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { fetchPOTW } = require('../../services/potwService');
const { teamColors } = require('../../canvas/compareCanvas');


module.exports = async function potwHandler(interaction){

    try{

        const potws = await fetchPOTW();

        if(!potws || potws.length===0){
            return interaction.reply({
                content:"No POTW data found.",
                ephemeral:true
            });
        }

        let page = 0;
        const pageSize = 5;
        const totalPages = Math.ceil(potws.length / pageSize);

        // -Build page
        let startIdx = page * pageSize;
        let slice = potws.slice(startIdx, startIdx + pageSize);
        let mainPOTW = slice[0];

        let list = slice.map(p =>
            `**GW${p.gw}** — 🏆 **${p.name}** (${p.points} pts)`
        ).join("\n");

        let embed = new EmbedBuilder()
            .setTitle("🏆 Player of the Week — Season Summary")
            .setDescription(list)
            .setFooter({
                text:`Page ${page+1}/${totalPages} • FPL Bot`,
                iconURL:'https://i.imgur.com/AfFp7pu.png'
            })
            .setTimestamp()
            .setColor(teamColors[mainPOTW.team] || 0x1F8B4C);

        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('potw_prev')
                    .setLabel('⬅ Prev')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page===0),

                new ButtonBuilder()
                    .setCustomId('potw_next')
                    .setLabel('Next ➡')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page===totalPages-1)
            );

        // Send
        const msg = await interaction.reply({
            embeds:[embed],
            components:[row],
            fetchReply:true
        });

        const collector = msg.createMessageComponentCollector({
            time:60000
        });

        collector.on('collect', async i => {

            if(i.user.id!==interaction.user.id){
                return i.reply({
                    content:"This menu is not for you.",
                    ephemeral:true
                });
            }

            if(i.customId==='potw_next' && page<totalPages-1)
                page++;

            if(i.customId==='potw_prev' && page>0)
                page--;

            startIdx = page * pageSize;
            slice = potws.slice(startIdx, startIdx + pageSize);

            list = slice.map(p =>
                `**GW${p.gw}** — 🏆 **${p.name}** (${p.points} pts)`
            ).join("\n");

            embed = new EmbedBuilder()
                .setTitle("🏆 Player of the Week — Season Summary")
                .setDescription(list)
                .setFooter({
                    text:`Page ${page+1}/${totalPages} • FPL Bot`,
                    iconURL:'https://i.imgur.com/AfFp7pu.png'
                })
                .setTimestamp()
                .setColor(teamColors[mainPOTW.team] || 0x1F8B4C);

            row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('potw_prev')
                        .setLabel('⬅ Prev')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page===0),

                    new ButtonBuilder()
                        .setCustomId('potw_next')
                        .setLabel('Next ➡')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page===totalPages-1)
                );

            await i.update({
                embeds:[embed],
                components:[row]
            });
        });

        collector.on('end', async()=>{
            msg.edit({ components:[] }).catch(()=>{});
        });

    }
    catch(err){

        console.error("Error in potwHandler:", err);

        if(!interaction.replied){
            await interaction.reply({
                content:"Error fetching POTW"
            });
        }
    }
};
