const { 
	SlashCommandBuilder, 
	PermissionFlagsBits,
	EmbedBuilder
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Select a member and kick them.')
		.addUserOption((option) =>
			option
				.setName('target')
				.setDescription('The member to kick')
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {

		const target = interaction.options.getUser('target');

		const member = await interaction.guild.members.fetch(target.id).catch(() => null);

		if(!member){
			return interaction.reply({
				content: "Không tìm thấy member trong server.",
				ephemeral: true
			});
		}

		if(member.id === interaction.user.id){
			return interaction.reply({
				content: "M không thể kick chính mình.",
				ephemeral: true
			});
		}

		if(member.id === interaction.client.user.id){
			return interaction.reply({
				content: "Không thể kick bot.",
				ephemeral: true
			});
		}

		if(member.roles.highest.position >= interaction.member.roles.highest.position){
			return interaction.reply({
				content: "M không đủ quyền để kick member này.",
				ephemeral: true
			});
		}

		if(!member.kickable){
			return interaction.reply({
				content: "Bot không đủ quyền để kick member này.",
				ephemeral: true
			});
		}

		await member.kick(`Kicked by ${interaction.user.tag}`);

		const embed = new EmbedBuilder()
			.setColor(0xff0000)
			.setTitle("KICK MEMBER")
			.setDescription(
				`✅ Đã kick **${target.tag}**\n` +
				`👮 Moderator: **${interaction.user.tag}**`
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
