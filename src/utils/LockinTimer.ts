import { GuildMember } from "discord.js";
import { Config } from "../config";
import { removeRoles } from "./RemoveRoles";
import { unlockEmbed } from "../embeds/UnlockEmbed";

const streamingTimeouts: { [userId: string]: NodeJS.Timer } = {};

export const startTimer = (userId: string, member: GuildMember): void => {
  console.log(`Starting timer for user ${userId}`);
  streamingTimeouts[userId] = setTimeout(async () => {
    if (
      member.voice.channel &&
      Config.lockedVCIds.includes(member.voice.channel.id)
    ) {
      await removeRoles(member);

      await member.voice.setMute(false);

      const voiceChannel = member.voice.channel;

      if (voiceChannel) {
        const embed = unlockEmbed(member);

        await voiceChannel.send({ embeds: [embed] });
      }
    }
    delete streamingTimeouts[userId];
  }, Config.DURATION_MINUTES * 60 * 1000);
};

export const cancelTimer = (userId: string): void => {
  console.log(`Cancelling timer for user ${userId}`);
  if (streamingTimeouts[userId]) {
    clearTimeout(streamingTimeouts[userId]);
    delete streamingTimeouts[userId];
  }
};
