import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember } from "discord.js";
import { Config } from "../config";
import { cancelTimer } from "../utils/LockinTimer";
import { removeRoles } from "../utils/RemoveRoles";
import { unlockEmbed } from "../embeds/UnlockEmbed";

export const command = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to lock/unlock")
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

    const hasMuteRole = guildMember.roles.cache.has(Config.muteRoleId);
    const hasMuteFromBotRole = guildMember.roles.cache.has(
      Config.muteFromBotRoleId
    );

    if (!hasMuteRole || !hasMuteFromBotRole) {
      return interaction.reply({
        content: `${guildMember.user.tag} is not currently a Yapper.`,
        ephemeral: true,
      });
    }

    cancelTimer(guildMember.id);

    await removeRoles(guildMember);

    await guildMember.voice.setMute(false);

    const voiceChannel = interaction.channel?.isVoiceBased()
      ? interaction.channel
      : null;

    if (voiceChannel) {
      const embed = unlockEmbed(guildMember);

      await voiceChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: `${guildMember.user.tag} has been unlocked.`,
      ephemeral: true,
    });
  },
};
