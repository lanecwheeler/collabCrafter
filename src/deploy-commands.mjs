await import ("dotenv").then(i => i.config());
import { REST, Routes } from 'discord.js'
import * as fs from 'fs'

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('src/commands').filter(file => file.endsWith('.mjs'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	await import(`./commands/${file}`).then((res, err) => {
		commands.push(res.default.data.toJSON());
	});
}

(async () => {
	const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] })
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
		
			// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);
		
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();