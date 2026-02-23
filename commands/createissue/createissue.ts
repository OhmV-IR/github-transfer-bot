import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Octokit } from "@octokit/rest";
import { permissionRoleName } from "../grantpermission/grantpermission";


if(!process.env.GITHUB_TOKEN){
    throw new Error("No github token configured");
}
const gh: Octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});


module.exports = {
    data: new SlashCommandBuilder()
      .setName("movetogithub")
      .setDescription("Creates an issue on github. Non-linking so future messages will not be synced.")
    .addBooleanOption(opt => 
      opt.setName("closePost")
        .setDescription("Whether or not the post should be closed after the issue is created")
        .setRequired(false)
    )
    .addStringOption(opt => 
      opt.setName("type")
        .setDescription("The type of issue to make")
        .setRequired(true)
        .addChoices(
            { name: "Feature", value: "Feature" },
            { name: "Task", value: "Task" },
            { name: "Bug", value: "Bug" }
        )
    )
    .addStringOption(opt => 
      opt.setName("repo")
        .setDescription("The repository to make the issue on")
        .setRequired(true)
        .addChoices(
            { name: "Rebar", value: "pylonmc/rebar" },
            { name: "Pylon", value: "pylonmc/pylon" }
        )
    )
    .addStringOption(opt => 
      opt.setName("labels")
        .setDescription("Labels to add to the issue separated by commas")
        .setRequired(false)
    ),

    async execute(interaction: ChatInputCommandInteraction){
        await interaction.deferReply();
        if(interaction.channel == null || !interaction.channel.isThread()){
            interaction.reply("ERROR: command not triggered from forum post channel");
            return;
        }
        if(!(interaction.member instanceof GuildMember)){
            interaction.reply("ERROR: Couldn't find GuildMember who ran this command");
            return;
        }
        if(!interaction.member.roles.cache.some(r => r.name === permissionRoleName)){
            interaction.reply("ERROR: No permission");
            return;
        }
        const firstMsg = await interaction.channel.fetchStarterMessage();
        if(!firstMsg){
            interaction.reply("ERROR: no starter message in thread");
            return;
        }
        let repoOpt = interaction.options.get("repo")?.value?.toString()
        if(!repoOpt){
            interaction.reply("ERROR: Could not find repo option");
            return;
        }
        let repoOptSplit = repoOpt.split('/');
        let owner = repoOptSplit.at(0);
        if(!owner){
            interaction.reply("ERROR: Could not find owner");
            return;
        }
        let repo = repoOptSplit.at(1);
        if(!repo){
            interaction.reply("ERROR: Could not find repo");
            return;
        }
        const res = await gh.issues.create({
            owner,
            repo,
            title: interaction.channel.name,
            labels: interaction.options.get("labels")?.value?.toString().split(','),
            body: `**Issue reported by: ${firstMsg.author.username}:**\n${firstMsg.cleanContent}`
        });
        if(res.status != 201){
            interaction.reply("ERROR: Failed to create github issue");
            return;
        }
        var msgs = await interaction.channel.messages.fetch();
        var nonFirstMsgs = msgs.filter(msg => msg.id != firstMsg.id)
        for(const msg of nonFirstMsgs){
            await gh.issues.createComment({
                owner: "pylonmc",
                repo,
                issue_number: res.data.number,
                body: `**Message from ${msg[1].author.username}:**\n${msg[1].cleanContent}`
            })
        }
        if(interaction.options.get("closePost")?.value?.toString() == "true"){
            await interaction.channel.setArchived(true);
            await interaction.channel.setLocked(true);
        }
        interaction.reply(`Successfully created issue [#${res.data.number}](https://github.com/pylonmc/${repo}/issue/${res.data.number})`);
    }
};