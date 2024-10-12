import { EmbedBuilder, GuildMember } from "discord.js";

export function createYapperEmbed(guildMember: GuildMember): EmbedBuilder {
  return new EmbedBuilder()
    .setAuthor({
      name: "Yapper Alert!",
      iconURL: "https://i.imgur.com/M3RIk18.png",
    })
    .setDescription(
      `${guildMember.toString()}, you have been Yapping. \n\n
        You will remain muted in Locked-In VC until you share stream for **5 minutes**.\n\n
        *Get to work, blood.*`
    )
    .setColor(0xd5442a)
    .setFooter({
      text: "Locked-In Devs",
    })
    .setTimestamp();
}
