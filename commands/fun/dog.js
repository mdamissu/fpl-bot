const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dog')
		.setNameLocalizations({
			pl: 'pies',
			de: 'hund',
		})
		.setDescription('Get a cute picture of a dog!')
		.setDescriptionLocalizations({
			pl: 'Słodkie zdjęcie pieska!',
			de: 'Poste ein niedliches Hundebild!',
		})
		.addStringOption((option) =>
			option
				.setName('breed')
				.setDescription('Breed of dog')
				.setNameLocalizations({
					pl: 'rasa',
					de: 'rasse',
				})
				.setDescriptionLocalizations({
					pl: 'Rasa psa',
					de: 'Hunderasse',
				})
				.setRequired(false)
		),

	async execute(interaction) {

		const breed = interaction.options.getString('breed');

		let apiUrl;

		// Nếu không nhập breed → random
		if (!breed) {
			apiUrl = 'https://dog.ceo/api/breeds/image/random';
		} else {
			apiUrl = `https://dog.ceo/api/breed/${breed.toLowerCase()}/images/random`;
		}

		try {
			const res = await fetch(apiUrl);
			const data = await res.json();

			// Check breed hợp lệ
			if (data.status !== "success") {
				return interaction.reply({
					content: `❌ Không tìm thấy breed **"${breed}"**`,
					ephemeral: true,
				});
			}

			const embed = new EmbedBuilder()
				.setColor(0x00ffff)
				.setTitle("🐶 Cute Dog")
				.setDescription(
					breed 
						? `Breed: **${breed}**`
						: 'Random dog picture'
				)
				.setImage(data.message)
				.setFooter({ text: 'Powered by dog.ceo' })
				.setTimestamp();

			await interaction.reply({
				embeds: [embed],
			});

		} catch (err) {
			console.error(err);
			await interaction.reply({
				content: "⚠️ Can't get dog pics right now",
				ephemeral: true,
			});
		}
	}
};
