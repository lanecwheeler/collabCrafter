import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import { UserConfigs } from '../classes/index.js'

export default {
	data: new SlashCommandBuilder()
			.setName('enable')
			.setDescription('Enable a user for a collab generation')
			.addStringOption(option => 
				option.setName('user')
					.setDescription('The user you want to update')
					.setAutocomplete(true)),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
		let choices = [];

		if (focusedOption.name === 'user') {
			const members = await interaction.guild.members.fetch({
				query: focusedOption.value.toLowerCase(),
				limit: 25
			});
			for(let [id, member] of members) {
				const userNickCombo = `${member.user.username} ${member.nickname ? `(${member.nickname})` : ''}`
				if(isMod || id == interaction.member.id)
					choices.push({'name': userNickCombo, 'value': id})
			}
			
			await interaction.respond(choices)
		}
	},
	async execute(interaction) {
		try {
			const { 
				guildId, 
				user: {id: userId},
			} = interaction
			const user = interaction.options.get('user')?.value ?? userId;

			const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
			if(!isMod && user !== userId) await interaction.reply({
				content: "You do not have permission to update this user. Naughty Naughty!",
				ephemeral: true
			})

			const updates = { $set: {enabled: true}}

			const uc = new UserConfigs(guildId);
			const embed = await uc.getMemberData(user)
				.then(async res => {
					if(!res || !res.name) return new EmbedBuilder()
						.setColor([223, 70, 85])
						.setTitle("Uh oh")
						.setDescription(`Please ensure user has set their info before trying to enable them`)

					return await uc.updateUser(user, updates).then((res) => {
						if(!res.ok) throw res
						return new EmbedBuilder()
							.setColor([97, 23, 181])
							.setTitle("Success!")
							.setDescription(`${res.value.name} can now be added to collabs`)
					})	
				})

			interaction.reply({
				embeds: [embed],
				ephemeral: true
			})
		} catch (err) {
			console.log(err)
			interaction.reply({
				content: "Something went terribly TERRIBLY wrong. Oh no.",
				ephemeral: true
			})
		}
	}
};