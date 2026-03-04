import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } from "discord.js";
import path from "node:path";
import fs from "node:fs";

export let discordToGithubID: Map<string, string> = new Map();
export const ghIdsFilePath = "./ghids.json";
export const ghIdsDir = path.dirname(ghIdsFilePath);

export function SyncGhIDSToDisk() {
    if(!fs.existsSync(ghIdsDir)) {
        fs.mkdirSync(ghIdsDir, { recursive: true });
    }
    fs.writeFileSync(ghIdsFilePath, JSON.stringify(discordToGithubID));
}

export function LoadGhIdsFromDisk() {
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(ghIdsFilePath, "utf-8");
    } catch (err) {
        console.error("failed to load github IDs from disk: " + err);
        return;
    }
    const parsed = JSON.parse(fileContent);
    if (parsed) {
        discordToGithubID = new Map(Object.entries(parsed));
    }
}

export default {
   data: new SlashCommandBuilder()
      .setName("linkgh")
      .setDescription("Link a discord user to a github user")
      .addUserOption(opt =>
         opt.setName("user")
            .setDescription("User to link to a github account")
            .setRequired(true)
      )
      .addStringOption(opt => 
        opt.setName("ghid")
           .setDescription("The github username to link to the discord user")
           .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .setContexts(InteractionContextType.Guild),

   async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply();
      const userOpt = interaction.options.getUser("user");
      if (!userOpt) {
         await interaction.editReply("ERROR: No user provided");
         return;
      }
      if (!interaction.guild) {
         await interaction.editReply("ERROR: Could not find server this was called from");
         return;
      }
      const user = await interaction.guild?.members.fetch(userOpt.id);
      if (!user) {
         await interaction.editReply("ERROR: Cannot get the user to link");
         return;
      }
      const ghId = interaction.options.getString("ghid");
      if (!ghId) {
         await interaction.editReply("ERROR: No github ID provided");
         return;
      }
      discordToGithubID.set(user.id, ghId);
      SyncGhIDSToDisk();
      await interaction.editReply(`Linked ${user.user.tag} to github username ${ghId}`);
      return;
   }
}