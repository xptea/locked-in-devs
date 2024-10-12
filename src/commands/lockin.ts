import { EmbedBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { Config } from "../config";
import { startTimer } from "../utils/LockinTimer";
import { createYapperEmbed } from "../embeds/YapperEmbed";

export const command = {
  data: new SlashCommandBuilder()
    .setName("yapper")
    .setDescription("Label a user as Yapping")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to label as Yapping")
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    const userOption = interaction.options.get("user", true)?.user;
    const memberId = userOption?.id ?? null;

    const guild = interaction.guild;
    if (!guild || !memberId) {
      return interaction.reply({
        content: "Invalid user or guild!",
        ephemeral: true,
      });
    }

    const guildMember = (await guild.members.fetch(memberId)) as GuildMember;

    await guildMember.roles.add([Config.muteRoleId, Config.muteFromBotRoleId]);

    if (guildMember.voice.channel) {
      await guildMember.voice.setMute(true);

      const isInLockedVC =
        guildMember.voice.channelId &&
        Config.lockedVCIds.includes(guildMember.voice.channelId);
      const isStreaming = guildMember.voice.streaming;

      if (isInLockedVC && isStreaming) {
        startTimer(guildMember.id, guildMember);
      }
    }

    const voiceChannel = interaction.channel?.isVoiceBased()
      ? interaction.channel
      : null;

    if (voiceChannel) {
      const embed = createYapperEmbed(guildMember);

      await voiceChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: `${guildMember.user.tag} has been labelled as Yapping.`,
      ephemeral: true,
    });
  },
};
