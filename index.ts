import dotenv from 'dotenv';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import initializeCommands from './commands.js';
import { LoadTagsFromDisk } from './commands/addmovedtag/addmovedtag.js';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
});

LoadTagsFromDisk();

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	try {
		await initializeCommands();
	} catch (err) {
		console.error('Command initialization failed', err);
	}
});

let commands = new Collection<string, any>();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const mod = await import(pathToFileURL(filePath).href).catch(async () => {
			return await import(pathToFileURL(filePath.endsWith('.ts') ? filePath.replace(/\.ts$/, '.js') : filePath).href);
		});
		const command = mod.default ?? mod;
		if ('data' in command && 'execute' in command) {
			commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	command.execute(interaction);
});