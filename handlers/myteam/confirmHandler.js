const MyTeam = require('../../models/userModels');
const Server = require('../../models/serverModels');
const { verifyEntry, getPendingVerify, confirmLink } = require('../../services/myteamService');
// Confirm user handle
module.exports = async function confirmHandler(interaction){
    try{
        await interaction.deferReply({ flags:64 });

        const pending = await getPendingVerify(interaction.user.id);
        if(!pending){
            return await interaction.editReply("No active verification found.");
        }

        const user = await verifyEntry(pending.entryId);
        if(!user){
            return await interaction.editReply("FPL profile no longer exists.");
        }

        const text = (
            (user.name || "") + " " +
            (user.player_first_name || "") + " " +
            (user.player_last_name || "")
        ).toLowerCase();

        if(!text.includes(pending.code.toLowerCase())){
            return await interaction.editReply(
`Verification code not found.

Current code:
\`${pending.code}\`

Please ensure this exact code is in your **Team Name or Manager Name**.` );
        }

        const totalPoints = user.summary_overall_points || 0;
        const overallRank = user.summary_overall_rank || 0;
        const eventPoints = user.summary_event_points || 0;
        const eventRank = user.summary_event_rank || 0;
        const region = user.player_region_name || "";
        const userTeamDoc = await MyTeam.findOneAndUpdate(
            { discordId: interaction.user.id },
            {
                entryId: pending.entryId,
                handle: `${user.player_first_name || ""} ${user.player_last_name || ""}`.trim(),
                totalPoints,
                overallRank,
                eventPoints,
                eventRank,
                region,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        if(interaction.guildId){
            await Server.findOneAndUpdate(
                { serverId: interaction.guildId },
                {
                    serverName: interaction.guild.name,
                    $addToSet: { users: userTeamDoc._id }
                },
                { upsert: true }
            );
        }

        await confirmLink(interaction.user.id);

        await interaction.editReply(
`✅ **Verification successful!**

Manager: **${user.player_first_name || ""} ${user.player_last_name || ""}**
Team: **${user.name || "Unknown"}**
Entry ID: **${pending.entryId}**
Total Points: **${totalPoints}**
Overall Rank: **${overallRank}**
GW Points: **${eventPoints}**
GW Rank: **${eventRank}**
Region: **${region}**

Your Discord account is now linked to this FPL team.`);

    }
    catch(err){
        console.error('Error in confirmHandler:', err);
        if(interaction.deferred || interaction.replied){
            await interaction.editReply("Error while confirming account");
        } else {
            await interaction.reply({
                content: "An unexpected error occurred.",
            });
        }
    }
};
