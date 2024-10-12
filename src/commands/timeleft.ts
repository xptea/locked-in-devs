import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, Message } from "discord.js";
import { getRemainingTime } from "../utils/LockinTimer";

export const command = {
  data: new SlashCommandBuilder()
    .setName("timeleft")
    .setDescription("Check how much time is left for a user to be unmuted.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to check time left")
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

    const remainingTime = getRemainingTime(memberId);
    if (remainingTime === null) {
      return interaction.reply({
        content: `${guildMember.user.tag} does not have an active mute timer.`,
        ephemeral: true,
      });
    }

    const endTime = Math.floor((Date.now() + remainingTime) / 1000);

    // Send the reply with the relative timestamp
    const reply = await interaction.reply({
      content: `${guildMember.user.tag} will be unmuted <t:${endTime}:R>.`,
      ephemeral: true,
      fetchReply: true,
    }) as Message;

    setTimeout(() => {
      reply.delete().catch(console.error);
    }, remainingTime);
  },
};
