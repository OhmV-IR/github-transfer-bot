import { REST, Routes } from "discord.js"
import fs from 'node:fs';
import path from 'node:path';

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
    throw new Error("DISCORD_TOKEN environment variable is not set.");
}
const rest = new REST().setToken(discordToken);

const commands: any[] = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
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

(async () => {
    try {
        console.log("Refreshing commands");
        const data = await rest.put(Routes.applicationCommands(clientId),
            { body: commands });
    } catch (err) {
        console.error(err);
    }
})