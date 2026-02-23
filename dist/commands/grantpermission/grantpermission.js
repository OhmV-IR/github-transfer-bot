import { GuildMember, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
export const permissionRoleName = "GHIssueCreator";
export default {
    data: new SlashCommandBuilder()
        .setName("setallowedroles")
        .setDescription("Set the roles that are allowed to use the create issue command")
        .addUserOption(opt => opt.setName("user")
        .setDescription("User to grant the permission to create issues to")
        .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getMember("user");
        if (!user || !(user instanceof GuildMember)) {
            interaction.reply("ERROR: Cannot get the user to give permission to");
            return;
        }
        if (!interaction.guild) {
            interaction.reply("ERROR: Could not find server this was called from");
            return;
        }
        if (!(interaction.member instanceof GuildMember)) {
            interaction.reply("ERROR: Could not find the member running this command");
            return;
        }
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            interaction.reply("ERROR: Only people with the Administrator permission can execute this command");
            return;
        }
        let role = interaction.guild.roles.cache.find(r => r.name === permissionRoleName);
        if (!role) {
            role = await interaction.guild.roles.create({
                name: permissionRoleName,
                color: "Orange",
                reason: "Created GH issue creator role",
            });
        }
        await user.roles.add(role);
        await interaction.reply("Granted permission.");
    }
};
