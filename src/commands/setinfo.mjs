import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import { UserConfigs } from '../classes/index.js'

export default {
	data: new SlashCommandBuilder()
			.setName('setinfo')
			.setDescription('Set a collab config for a user')
			.addStringOption(option => 
				option.setName('user')
					.setDescription('The user you want to update')
					.setAutocomplete(true))
			.addStringOption(option => 
				option.setName('name')
					.setMinLength(0)
					.setDescription('The name you go by'))
			.addStringOption(option => 
				option.setName('link')
					.setMinLength(0)
					.setDescription('Your twitch.tv [or] twitter [or] Youtube [or] etc... link'))
			.addStringOption(option => 
				option.setName('plug')
					.setMinLength(0)
					.setDescription('A short plug for your channel, eg "Hop on over and follow me here!"')),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
		let choices = [];

		if (focusedOption.name === 'user') {
			(await interaction.guild.members.fetch()).forEach((member, id) => {
				const optContainsQuery = 
					member.nickname?.toLowerCase().includes(focusedOption.value.toLowerCase()) 
					|| member.user.username.toLowerCase().includes(focusedOption.value.toLowerCase()) 
					|| member.user.id.includes(focusedOption.value);
				if(focusedOption.value && !optContainsQuery) return;
				const userNickCombo = `${member.user.username} ${member.nickname ? `(${member.nickname})` : ''}`
				if(isMod || id == interaction.member.id)
					choices.push({'name': userNickCombo, 'value': id})
			})
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
			const name = interaction.options.get('name')?.value;
			const link = interaction.options.get('link')?.value;
			const plug = interaction.options.get('plug')?.value;
			const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
			if(!isMod && user !== userId) await interaction.reply({
				content: "You do not have permission to update this user. Naughty Naughty!",
				ephemeral: true
			})

			const updates = { $set: {}}
			if(name) updates.$set.name = name
			if(link) updates.$set.link = link
			if(plug) updates.$set.plug = plug

			const uc = new UserConfigs(guildId);
			await uc.updateUser(user, updates).then((res) => {
				if(!res.ok) throw res
				const changes = Object.keys(updates.$set).map(field => res.lastErrorObject?.updatedExisting
					? {field: `${field[0].toUpperCase()}${field.slice(1)}`, value: `${res.value[field] ?? " "} ➡️ ${updates.$set[field]}`}
					: {field: `${field[0].toUpperCase()}${field.slice(1)}`, value: `${updates.$set[field]}`}
				)

				const embed = new EmbedBuilder()
					.setColor([97, 23, 181])
					.setTitle("Success!")
					.setDescription(`The following fields were ${res.lastErrorObject?.updatedExisting ? 'updated' : 'set'}`)
				
				changes.forEach(change => embed.addFields({name: change.field, value: change.value}))
				if(!res.lastErrorObject.updatedExisting)
					embed.setFooter('Be sure to use /enable so you can be added to collabs!')

				interaction.reply({
					embeds: [embed],
					ephemeral: true
				})
			})
			
			
		} catch (err) {
			interaction.reply({
				content: "Something went terribly TERRIBLY wrong. Oh no.",
				ephemeral: true
			})
		}


	}
};