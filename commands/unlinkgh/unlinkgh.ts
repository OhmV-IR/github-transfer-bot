import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } from "discord.js";
import { discordToGithubID, ghIdsFilePath, SyncGhIDSToDisk } from "../linkgh/linkgh.js";

export default {
   data: new SlashCommandBuilder()
      .setName("unlinkgh")
      .setDescription("Unlink a discord user from a github user ID")
      .addUserOption(opt =>
         opt.setName("user")
            .setDescription("User to unlink from a github ID")
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
         await interaction.editReply("ERROR: Cannot get the user to unlink");
         return;
      }
      discordToGithubID.delete(user.id);
      SyncGhIDSToDisk();
      await interaction.editReply(`Unlinked ${user.user.tag} from github ID`);
      return;
   }
}