const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // public beta key

const CATEGORY_MAP = {
	gif_funny: "funny",
	gif_meme: "meme",
	gif_movie: "movie",
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gif')
		.setDescription('Sends a random gif!')
		.addStringOption((option) =>
			option
				.setName('category')
				.setDescription('The gif category')
				.setRequired(true)
				.addChoices(
					{ name: 'Funny', value: 'gif_funny' },
					{ name: 'Meme', value: 'gif_meme' },
					{ name: 'Movie', value: 'gif_movie' },
				),
		),

	async execute(interaction) {

		// Lấy category value
		const category = interaction.options.getString('category');

		if (!CATEGORY_MAP[category]) {
			return interaction.reply({
				content: "❌ Category not available",
				ephemeral: true,
			});
		}

		const query = CATEGORY_MAP[category];

		try {
			// Gọi Giphy API
			const url = `https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${query}&rating=pg`;

			const res = await fetch(url);
			const json = await res.json();

			if (!json.data || !json.data.images) {
				throw new Error("Invalid Giphy data");
			}

			const gifUrl = json.data.images.original.url;

			const embed = new EmbedBuilder()
				.setColor(0x8A2BE2)
				.setTitle("🎬 Random GIF")
				.setDescription(`Category: **${query}**`)
				.setImage(gifUrl)
				.setFooter({ text: "Powered by GIPHY" })
				.setTimestamp();

			await interaction.reply({
				embeds: [embed],
			});

		} catch (err) {
			console.error(err);

			await interaction.reply({
				content: "⚠️ Can not g",
				ephemeral: true,
			});
		}
	},
};
