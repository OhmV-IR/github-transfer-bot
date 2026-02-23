const disc = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new disc.Client();

client.login(process.env.DISCORD_TOKEN);