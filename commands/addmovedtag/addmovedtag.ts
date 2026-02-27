import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";

export let tagsToAdd: string[] = [];
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
    if (Array.isArray(parsed)) {
        tagsToAdd = parsed;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("addmovedtag")
        .setDescription("Set the tag that is added to posts that have their issues moved to github")
        .addStringOption(opt =>
            opt.setName("tagId")
                .setDescription("The ID of the tag to add to posts that have their issues moved to github")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const tagId = interaction.options.getString("tagId");
        if (!tagId) {
            await interaction.editReply("ERROR: No tag ID provided");
            return;
        }
        tagsToAdd.push(tagId);
        SyncTagsToDisk();
        await interaction.editReply(`Successfully added tag ID ${tagId} to the list of tags to be added to moved posts`);
    }
}