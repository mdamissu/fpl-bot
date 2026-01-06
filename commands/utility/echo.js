const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption((option) =>
			option
				.setName('input')
				.setDescription('The input to echo back')
				.setMaxLength(2_000)
				.setRequired(true)
		)
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to echo into')
				.addChannelTypes(ChannelType.GuildText)
		)
		.addBooleanOption((option) =>
			option.setName('embed').setDescription('Whether or not the echo should be embedded')
		),

	async execute(interaction){
		const text = interaction.options.getString('input');
		const channel = interaction.options.getChannel('channel');
		const useEmbed = interaction.options.getBoolean('embed') ?? false;

		let payload;

		if(useEmbed){
			payload = {
				embeds:[
					new EmbedBuilder()
						.setDescription(text)
						.setColor(0x00B0F4)
				]
			};
		}else{
			payload = {
				content: text
			};
		}

		if(channel){
			await channel.send(payload);

			return interaction.reply({
				content:`✅ Sent to ${channel}`,
				ephemeral:true
			});
		}

		await interaction.reply(payload);
	}
};
