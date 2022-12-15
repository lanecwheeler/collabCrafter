import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import { UserConfigs } from '../classes/index.js'

export default {
	data: new SlashCommandBuilder()
			.setName('unsetinfo')
			.setDescription('Remove collab fields for a user')
			.addStringOption(option => 
				option.setName('user')
					.setDescription('The user you want to update')
					.setAutocomplete(true)
					.setRequired(true))
			.addStringOption(option => 
				option.setName('field')
					.setDescription('Field to remove')
					.setChoices(
						{name: 'Link', value: 'link'},
						{name: 'Plug', value: 'plug'}
					)
					.setRequired(true)),
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
			const user = interaction.options.get('user');
			const field = interaction.options.get('field');

			const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
			if(!isMod && user?.value !== userId) await interaction.reply({
				content: "You do not have permission to update this user. Naughty Naughty!",
				ephemeral: true
			})

			const updates = { $unset: {} }
			updates.$unset[field.value] = ""

			const uc = new UserConfigs(guildId);
			await uc.updateUser(user?.value, updates).then((res) => {
				if(!res.ok) throw res

				const embed = new EmbedBuilder()
					.setColor([97, 23, 181])
					.setTitle("Success!")
					.setDescription(`The ${field.value} field was removed`)
				
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