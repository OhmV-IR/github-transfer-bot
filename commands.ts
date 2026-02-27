import { REST, Routes } from "discord.js"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
dotenv.config();

export default async function initializeCommands() {
    const discordToken = process.env.DISCORD_TOKEN;
    if (!discordToken) {
        throw new Error("DISCORD_TOKEN environment variable is not set.");
    }
    const rest = new REST().setToken(discordToken);

    const commands: any[] = [];
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            // use dynamic import for ESM; ensure we use file:// URL
            const commandModule = await import(pathToFileURL(filePath).href).catch(async () => {
                // fallback to trying with .js extension for TS source when running compiled code
                return await import(pathToFileURL(filePath.endsWith('.ts') ? filePath.replace(/\.ts$/, '.js') : filePath).href);
            });
            const command = commandModule.default ?? commandModule;
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    const clientId = process.env.CLIENT_ID;
    if (!clientId) {
        throw new Error("CLIENT_ID environment variable is not set.");
    }

    try {
        console.log(`Refreshing ${commands.length} commands`);
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Commands refreshed');
    } catch (err) {
        console.error('Failed refreshing commands', err);
        throw err;
    }
}