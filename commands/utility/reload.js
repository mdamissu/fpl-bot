const { SlashCommandBuilder } = require('discord.js');
const path = require('node:path');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option
				.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)
		),

	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();

		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply({
				content: `No command named \`${commandName}\` was found.`,
				ephemeral: true,
			});
		}

		const commandPath = path.join(__dirname, `${command.data.name}.js`);

		try {
			delete require.cache[require.resolve(commandPath)];

			const newCommand = require(commandPath);

			interaction.client.commands.set(newCommand.data.name, newCommand);

			await interaction.reply({
				content: `Command \`${newCommand.data.name}\` reloaded successfully.`,
				ephemeral: true,
			});
		} catch (error) {
			console.error(error);

			await interaction.reply({
				content: `Failed to reload command:\n\`${error.message}\``,
				ephemeral: true,
			});
		}
	},
};
