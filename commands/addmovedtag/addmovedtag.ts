import { ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";

export let tagsToAdd: Map<string, string[]> = new Map();
export const tagsFilePath = "./movedTags.json";
export const tagsDir = path.dirname(tagsFilePath);

export function SyncTagsToDisk() {
    if(!fs.existsSync(tagsDir)) {
        fs.mkdirSync(tagsDir, { recursive: true });
    }
    fs.writeFileSync(tagsFilePath, JSON.stringify(tagsToAdd));
}

export function LoadTagsFromDisk() {
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(tagsFilePath, "utf-8");
    } catch (err) {
        console.error("failed to load tags from disk: " + err);
        return;
    }
    const parsed = JSON.parse(fileContent);
    if (parsed && parsed instanceof Map) {
        tagsToAdd = parsed;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("addmovedtag")
        .setDescription("Set the tag that is added to posts that have their issues moved to github")
        .addStringOption(opt =>
            opt.setName("tag_id")
                .setDescription("The ID of the tag to add to moved posts")
                .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName("channel_id")
            .setDescription("The ID of the channel the tag ID applies to")
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setContexts(InteractionContextType.Guild),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        if(!interaction.inGuild() || !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.editReply("ERROR: No permission");
            return;
        }
        const tagId = interaction.options.getString("tag_id");
        if (!tagId) {
            await interaction.editReply("ERROR: No tag ID provided");
            return;
        }
        const channelId = interaction.options.getString("channel_id");
        if (!channelId) {
            await interaction.editReply("ERROR: No channel ID provided");
            return;
        }
        const existingTags = tagsToAdd.get(channelId) || [];
        existingTags.push(tagId);
        tagsToAdd.set(channelId, existingTags);
        SyncTagsToDisk();
        await interaction.editReply(`Successfully added tag ID ${tagId} to the list of tags to be added to moved posts`);
    }
}