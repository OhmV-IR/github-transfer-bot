import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";

export let tagsToAdd: string[] = [];
export const tagsFilePath = "movedTags.json";

export function SyncTagsToDisk() {
    fs.writeFileSync(tagsFilePath, JSON.stringify(tagsToAdd));
}

export function LoadTagsFromDisk() {
    const fileContent = fs.readFileSync(tagsFilePath, "utf-8");
    if (fileContent == "") {
        return;
    }
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
        tagsToAdd = parsed;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("rmmovedtag")
        .setDescription("Remove a tag from the list that is added to posts that have their issues moved to github")
        .addStringOption(opt =>
            opt.setName("tag_id")
                .setDescription("The ID of the tag to remove from the list of tags added to moved posts")
                .setRequired(true)
        ),

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
        const index = tagsToAdd.indexOf(tagId);
        if (index === -1) {
            await interaction.editReply(`ERROR: Tag ID ${tagId} is not in the list of moved tags`);
            return;
        }
        tagsToAdd.splice(index, 1);
        SyncTagsToDisk();
        await interaction.editReply(`Successfully removed tag ID ${tagId} from the list of tags to be added to moved posts`);
    }
}