import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } from "discord.js";

export const permissionRoleName = "GHIssueCreator"

export default {
   data: new SlashCommandBuilder()
      .setName("setallowedroles")
      .setDescription("Set the roles that are allowed to use the create issue command")
      .addUserOption(opt =>
         opt.setName("user")
            .setDescription("User to grant the permission to create issues to")
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
         await interaction.editReply("ERROR: Cannot get the user to give permission to");
         return;
      }
      if (!interaction.guild) {
         await interaction.editReply("ERROR: Could not find server this was called from");
         return;
      }
      if (!(interaction.member instanceof GuildMember)) {
         await interaction.editReply("ERROR: Could not find the member running this command");
         return;
      }
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
         await interaction.editReply("ERROR: Only people with the Administrator permission can execute this command");
         return;
      }
      let role = interaction.guild.roles.cache.find(r => r.name === permissionRoleName)
      if (!role) {
         role = await interaction.guild.roles.create({
            name: permissionRoleName,
            reason: "Created GH issue creator role",
         });
      }
      await user.roles.add(role);
      await interaction.editReply("Granted permission.");
   }
}