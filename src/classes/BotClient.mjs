import { Client, Collection, GatewayIntentBits, Options } from 'discord.js';
import * as fs from 'fs'
import * as path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

class BotClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.envConfig = {
            discordToken : process.env.DISCORD_TOKEN,
            prefix : process.env.PREFIX,
            mongodbUrl: process.env.MONGODB_URL,
        };
        this.commands = new Collection();
        this.registerCommands();
        this.registerEvents();
        this.login(this.envConfig.discordToken);
    }

    async registerCommands() {
        const commandsPath = path.join(__dirname, '../commands')
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'))

        for (const file of commandFiles) {
            await import(`../commands/${file}`).then((res, err) => {
                const command = res.default
                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command)
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
                }
            });
        }
    }

    async registerEvents() {
        const eventsPath = path.join(__dirname, '../events')
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.mjs'))

        for (const file of eventFiles) {
            await import(`../events/${file}`).then((res, err) => {
                const event = res.default
                if (event.once) {
                    this.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.on(event.name, (...args) => event.execute(...args));
                }
            });
        }
    }
}

export default BotClient;