import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import { UserConfigs } from '../classes/index.js'

export default {
	data: new SlashCommandBuilder()
			.setName('info')
			.setDescription('See a users collab config')
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
		console.log('lookin');
		try {
			const { 
				guildId, 
				user: {id: userId},
			} = interaction
			const user = interaction.options.get('user')?.value ?? userId

			const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
			if(!isMod && user !== userId) await interaction.reply({
				content: "You do not have permission to view this user. Naughty Naughty!",
				ephemeral: true
			})

			const uc = new UserConfigs(guildId);
			console.log(uc)
			const embed = await uc.getMemberData(user).then(async res => {
				if(!res) return new EmbedBuilder()
					.setColor([223, 70, 85])
					.setTitle("Uh oh")
					.setDescription(`We can't find that user. Please ensure they have set their info.`)
				
				const guildMember = await interaction.guild.members.fetch(user);
				return new EmbedBuilder()
					.setColor([97, 23, 181])
					.setTitle(`${guildMember.nickname ?? guildMember.user.username}'s Info`)
					.setThumbnail(guildMember.displayAvatarURL())
					.addFields(
						{name: 'Name', value: res.name ?? '\u200B'},
						{name: 'Link', value: res.link ?? '\u200B'},
						{name: 'Plug', value: res.plug ?? '\u200B'},
						{name: 'Enabled?', value: res.enabled ? '👍🏻' : '👎🏻'},
					)
				})
				interaction.reply({
					embeds: [embed],
					ephemeral: true
			})
		} catch (err) {
			console.log(err);
			interaction.reply({
				content: "Something went terribly TERRIBLY wrong. Oh no.",
				ephemeral: true
			})
		}


	}
};
