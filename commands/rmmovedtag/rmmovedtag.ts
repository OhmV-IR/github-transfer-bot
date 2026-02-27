import { ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { SyncTagsToDisk, tagsToAdd } from "../addmovedtag/addmovedtag.js";

export default {
    data: new SlashCommandBuilder()
        .setName("rmmovedtag")
        .setDescription("Remove a tag from the list that is added to posts that have their issues moved to github")
        .addStringOption(opt =>
            opt.setName("tag_id")
                .setDescription("The ID of the tag to remove from the list of tags added to moved posts")
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
        let tagList = tagsToAdd.get(interaction.options.getString("channel_id") ?? "");
        if(!tagList){
            await interaction.editReply("ERROR: No tags configured for that channel");
            return;
        }
        const index = tagList.indexOf(tagId);
        if (index === -1) {
            await interaction.editReply(`ERROR: Tag ID ${tagId} is not in the list of moved tags`);
            return;
        }
        tagList.splice(index, 1);
        tagsToAdd.set(interaction.options.getString("channel_id")!, tagList);
        SyncTagsToDisk();
        await interaction.editReply(`Successfully removed tag ID ${tagId} from the list of tags to be added to moved posts`);
    }
}