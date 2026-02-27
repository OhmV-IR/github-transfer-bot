import { ChatInputCommandInteraction, GuildMember, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { Octokit } from "@octokit/rest";
import { permissionRoleName } from "../grantpermission/grantpermission.js";
import { throttling } from "@octokit/plugin-throttling";
import { tagsToAdd } from "../addmovedtag/addmovedtag.js";

if (!process.env.GITHUB_TOKEN) {
    throw new Error("No github token configured");
}
const gh: Octokit = new (Octokit.plugin(throttling))({
    auth: process.env.GITHUB_TOKEN,
    throttle: {
        onRateLimit: (retryAfter, options) => {
            console.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
            console.log(`Retrying after ${retryAfter} seconds...`);
            return true;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
            console.warn(`Secondary rate limit hit for request ${options.method} ${options.url}`);
            console.log(`Retrying after ${retryAfter} seconds...`);
            return true;
        }
    }
});


export default {
    data: new SlashCommandBuilder()
        .setName("movetogithub")
        .setDescription("Creates an issue on github. Non-linking so future messages will not be synced.")
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
        )
        .addBooleanOption(opt =>
            opt.setName("close_post")
                .setDescription("Whether or not the post should be closed after the issue is created")
                .setRequired(false)
        )
        .addBooleanOption(opt =>
            opt.setName("add_tags")
                .setDescription("Whether or not to add the tags configured by /addmovedtag to the post. On by default")
                .setRequired(false)
        )
        .setContexts(InteractionContextType.Guild),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        if (interaction.channel == null || !interaction.channel.isThread()) {
            await interaction.editReply("ERROR: command not triggered from forum post channel");
            return;
        }
        if (!(interaction.member instanceof GuildMember)) {
            await interaction.editReply("ERROR: Couldn't find GuildMember who ran this command");
            return;
        }
        if (!interaction.member.roles.cache.some(r => r.name === permissionRoleName) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.editReply("ERROR: No permission");
            return;
        }
        const firstMsg = await interaction.channel.fetchStarterMessage();
        if (!firstMsg) {
            await interaction.editReply("ERROR: no starter message in thread");
            return;
        }
        let repoOpt = interaction.options.get("repo")?.value?.toString()
        if (!repoOpt) {
            await interaction.editReply("ERROR: Could not find repo option");
            return;
        }
        let repoOptSplit = repoOpt.split('/');
        let owner = repoOptSplit.at(0);
        if (!owner) {
            await interaction.editReply("ERROR: Could not find owner");
            return;
        }
        let repo = repoOptSplit.at(1);
        if (!repo) {
            await interaction.editReply("ERROR: Could not find repo");
            return;
        }
        const res = await gh.issues.create({
            owner,
            repo,
            title: interaction.channel.name,
            type: interaction.options.get("type")?.value?.toString(),
            labels: interaction.options.get("labels")?.value?.toString().split(','),
            body: `**Issue reported by: ${firstMsg.author.username}:**\n${firstMsg.cleanContent}`
        });
        if (res.status != 201) {
            await interaction.editReply("ERROR: Failed to create github issue");
            return;
        }
        console.log(`rate limit remaining: ${res.headers["x-ratelimit-remaining"]}`);
        console.log(`rate limit reset: ${res.headers["x-ratelimit-reset"]}`);
        var msgs = await interaction.channel.messages.fetch();
        var messagesToSync = msgs.filter(msg => msg.id != firstMsg.id).filter(msg => !msg.author.bot).reverse();
        for (const msg of messagesToSync) {
            let attachmentString = "";
            msg[1].attachments.forEach(attachment => {
                attachmentString += `\n![${attachment.name}](${attachment.url})`;
            });
            await gh.issues.createComment({
                owner,
                repo,
                issue_number: res.data.number,
                body: `**Message from ${msg[1].author.username}:**\n${msg[1].cleanContent}\n${attachmentString}`
            })

        }
        if (interaction.options.getBoolean("close_post") === true && !(interaction.channel.archived || interaction.channel.locked)) {
            await interaction.channel.setLocked(true);
        }
        if (interaction.options.getBoolean("add_tags") === false) {
            let newAppliedTags = [...interaction.channel.appliedTags];
            for (const tagId of tagsToAdd) {
                if (interaction.channel.appliedTags.some(appliedTagId => tagId === appliedTagId)) {
                    continue;
                }
                newAppliedTags.push(tagId);
            }
            if (newAppliedTags.length > interaction.channel.appliedTags.length) {
                await interaction.channel.setAppliedTags(newAppliedTags);
            }
        }
        await interaction.editReply(`Successfully created issue [#${res.data.number}](https://github.com/${owner}/${repo}/issues/${res.data.number})\nRate limit remaining: ${res.headers["x-ratelimit-remaining"]}\nRate limit resets at: <t:${res.headers["x-ratelimit-reset"]}:R> with ${res.headers["x-ratelimit-remaining"]} out of ${res.headers["x-ratelimit-limit"]} points remaining`);
    }
};