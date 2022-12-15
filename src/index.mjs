await import ("dotenv").then(i => i.config());
import { BotClient } from './classes/index.js'
 
// Create a new client instance
const client = new BotClient();