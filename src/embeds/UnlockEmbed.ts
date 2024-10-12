import { EmbedBuilder, GuildMember } from "discord.js";

export function unlockEmbed(guildMember: GuildMember): EmbedBuilder {
  return new EmbedBuilder()
    .setAuthor({
      name: "Unlocked",
      iconURL: "https://i.imgur.com/M3RIk18.png",
    })
    .setDescription(
      `Welcome back, ${guildMember.toString()}. \n\n
      You are no longer a *Yapper* and can now __speak freely__.\n\n
      *Stay locked in, or face the consequences.*`
    )
    .setColor(0x44d52a)
    .setFooter({
      text: "Locked-In Devs",
    })
    .setTimestamp();
}
