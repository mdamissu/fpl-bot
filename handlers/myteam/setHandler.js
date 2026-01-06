const MyTeam = require('../../models/userModels');
const {
    generateVerifyCode,
    verifyEntry,
    savePendingVerify
} = require('../../services/myteamService');

module.exports = async function setHandler(interaction){
    try{
        const entryId = interaction.options.getInteger('entry_id');

        await interaction.deferReply({ flags:64 });

        const user = await verifyEntry(entryId);

        if(!user){
            return interaction.editReply(
                "❌ FPL Entry ID does not exist"
            );
        }

        //  Generate verify code
        const code = generateVerifyCode();

        // Save pending instead of linking DB
        await savePendingVerify(
            interaction.user.id,
            interaction.user.username,
            entryId,
            code
        );


        // Reply instruction
        await interaction.editReply(
`🔐 **Ownership verify required**

Add this code to your **Team name** or **Manager name**:

\`${code}\`

Then run:

\`/myteam confirm\`

Profile to verify:
Manager: **${user.player_first_name} ${user.player_last_name}**
Team: **${user.name}**
Entry ID: **${entryId}**`
        );
    }
    catch(err){
        console.log('Error in setHandler');
        await interaction.editReply(
            "Error linking account\n" + err.message
        );
    }
};
