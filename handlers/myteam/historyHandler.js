const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MyTeam = require('../../models/userModels');
const { fetchHistory } = require('../../services/myteamService');
const { teamColors } = require('../../canvas/compareCanvas');
module.exports = async function historyHandler(interaction){
    try{
        await interaction.deferReply({ ephemeral:true });

        const myteam = await MyTeam.findOne({ discordId: interaction.user.id });
        if(!myteam)
            return interaction.editReply("❗ You haven't set your team yet. Use `/myteam set <handle>`");

        const history = await fetchHistory(myteam.entryId);
        if(!history || !history.current || history.current.length === 0)
            return interaction.editReply("❌ No history data found.");

        const recent = history.current.slice().reverse(); // reverse to have newest first
        let offset = 0;
        const pageSize = 5;

        const W_GW    = 4;
        const W_PTS   = 4;
        const W_TP    = 6;
        const W_BENCH = 6;
        const W_VAL   = 7;
        const W_TR    = 3;
        const W_COST  = 5;
        const W_OR    = 10;

        const makeTable = (start = 0) => {
            const lines = [];
            for(let i=start;i<Math.min(start+pageSize,recent.length);i++){
                const cur = recent[i];
                const prev = recent[i+1];

                let icon = "➖";
                if(prev){
                    if(cur.overall_rank < prev.overall_rank) icon = "📈";
                    else if(cur.overall_rank > prev.overall_rank) icon = "📉";
                }

                const g  = String(cur.event).padStart(W_GW);
                const p  = String(cur.points).padStart(W_PTS);
                const tp = String(cur.total_points).padStart(W_TP);
                const bp = String(cur.points_on_bench).padStart(W_BENCH);
                const val = "£" + (cur.value/10).toFixed(1);
                const v   = val.padStart(W_VAL);
                const tr  = String(cur.event_transfers).padStart(W_TR);
                const tc  = String(cur.event_transfers_cost).padStart(W_COST);
                const or  = (icon+" "+cur.overall_rank).padStart(W_OR);

                lines.push(`${g}|${p}|${tp}|${bp}|${v}|${tr}|${tc}|${or}`);
            }

            return "```" +
                "GW  |PTS | TOTAL|BENCH |VALUE  |TR |COST |   RANK\n" +
                "----+----+------+------+-------+---+-----+--------------\n" +
                lines.join("\n") +
                "```";
        }

        const embed = new EmbedBuilder()
            .setTitle(`${myteam.handle || "My Team"} – Recent Gameweeks`)
            .setColor(teamColors[myteam.handle] || 0x1F8B4C)
            .setDescription(makeTable(offset))
            .setFooter({ text: "FPL Bot • 📈 up | 📉 down | ➖ no change" })
            .setTimestamp();

        const rowButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('next').setLabel('⬅️ Next GWs').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('prev').setLabel('Previous GWs ➡️').setStyle(ButtonStyle.Primary)
            );

        const replyMsg = await interaction.editReply({ embeds:[embed], components:[rowButtons] });

        const collector = replyMsg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({ content: "This isn't for you!", ephemeral: true });

            if(i.isButton()){
                if(i.customId === 'next') offset = Math.max(0, offset - pageSize);
                if(i.customId === 'prev') offset = Math.min(recent.length - pageSize, offset + pageSize);

                embed.setDescription(makeTable(offset));
                await i.update({ embeds:[embed], components:[rowButtons] });
            }
        });

    } catch(err){
        console.error("Error in historyHandler",err);
        await interaction.editReply("Error loading history");
    }
};
