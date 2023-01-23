import { ChannelType, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { UserConfigs } from '../classes/index.js'

export default {
	data: new SlashCommandBuilder()
		.setName('collab')
		.setDescription('Replies with pastable collab string for everyone in your voice call!'),
	async execute(interaction) {
		const {
			channelId,
			user: {id: userId},
			member: {guild}
		} = interaction
		const uc = new UserConfigs(guild.id)

		const channels = await guild.channels.fetch()
		const curChannel = channels.get(channelId)
		const collabChannel = channels.find(channel => channel.name === curChannel.name && channel.type === ChannelType.GuildVoice)
		if(collabChannel === undefined) return interaction.reply({
			content: `Cannot find companion voice channel.
				\nPlease make sure the names of your text and voice channel match.
				\n\nAlternatively, you may also use the chat from within the voice call to run this command.`,
			ephemeral: true
		})

		const { members } = await collabChannel.fetch()
		members.delete(userId)
		if(!members.size) return interaction.reply({
			content: 'You\'re not currently in a collab. Sad.',
			ephemeral: true
		})
	
		const collabErrorEmbeds = {}
		const collabString = (async (reduceLevel = 0) => 
			await Promise.all(Array.from(members.values()).map(({id: user}) => 
				new Promise(async (res, rej) => {
					const data = await uc.getMemberData(user)
					if (!data || data.enabled === false || !data.name) rej(data)
					else {
						const message = data.collabMessage ? data.collabMessage + ' -' : ''
						const link = data.link ? data.link : 'twitch.tv/' + data.name
						res(`[ ${reduceLevel < 1 ? message : ''}${' ' + data.name + ' ' ?? ''}${(reduceLevel < 2 && link) ? '- ' + link : ''} ]`)
					}
				}).catch(async data => {
					const member = await guild.members.fetch(user)
					const { nickname, user: { username } } = member
					const builder = new EmbedBuilder()
						.setColor(data?.enabled === false ? [255, 199, 30] : [223, 70, 85])
						.setThumbnail(member.displayAvatarURL())
						.setTitle(data?.enabled === false 
							? (nickname ?? username) + " has disabled collabs" 
							: "No collab data found for " + (nickname ?? username))
						.setFooter({
							text: data?.enabled === false
								? `Have ${nickname ?? username} use /enable to enable collab generation.`
								: `Please make sure ${nickname ?? username} has used /setinfo to set their collab config.`,
						})
					if (nickname) builder.setDescription(`[(aka. 🛈)](https://www.randomkittengenerator.com "${username}")`)
					collabErrorEmbeds[user] = builder
				})
			)
		))

		const collabReduceLevel = async () => {
			const opt1 = (await collabString()).filter(a => a).join(' ').length,
				opt2 = (await collabString(1)).filter(a => a).join(' ').length,
				opt3 = (await collabString(2)).filter(a => a).join(' ').length,
				cmd = "!cmd edit collab ".length;

			if (opt1 + cmd < 501) return 0
			else if (opt2 + cmd < 501) return 1
			else if (opt3 + cmd < 501) return 2
			else return 3
		}

		collabString(await collabReduceLevel()).then(async (res) => {
			const finalErrors = Object.values(collabErrorEmbeds)
			const finalCollab = res.join(' ')

			if(finalErrors.length) await interaction.reply({ embeds: finalErrors, ephemeral : true })

			if(finalCollab.trim()) {
				const msg = new EmbedBuilder()
					.setColor([97, 23, 181])
					.setTitle('Here ya go...')
					.addFields(
						{name: '\u200b', value: `!cmd edit collab ${finalCollab}\n`},
					)
					.setFooter({
						text: 'Copy and paste this command into your chat to edit your streamelements !collab command'
					})
				finalErrors.length
					? await curChannel.send({embeds: [msg]})
					: await interaction.reply({embeds: [msg]})
			}
		})
	}
};