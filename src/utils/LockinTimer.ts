import type { GuildMember } from "discord.js";
import { Config } from "../config";
import { removeRoles } from "./RemoveRoles";
import { unlockEmbed } from "../embeds/UnlockEmbed";

const streamingTimeouts: { [userId: string]: NodeJS.Timer } = {};
const timerStartTimes: { [userId: string]: number } = {};

export const startTimer = (userId: string, member: GuildMember): void => {
  // console.log(`Starting timer for user ${userId}`);
  
  const now = Date.now();
  timerStartTimes[userId] = now;

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
    delete timerStartTimes[userId];
  }, Config.DURATION_MINUTES * 60 * 1000);
};

export const cancelTimer = (userId: string): void => {
  // console.log(`Cancelling timer for user ${userId}`);
  if (streamingTimeouts[userId]) {
    clearTimeout(streamingTimeouts[userId]);
    delete streamingTimeouts[userId];
    delete timerStartTimes[userId];
  }
};

export const getRemainingTime = (userId: string): number | null => {
  if (!timerStartTimes[userId]) return null;

  const elapsedTime = Date.now() - timerStartTimes[userId];
  const totalTime = Config.DURATION_MINUTES * 60 * 1000;
  return Math.max(0, totalTime - elapsedTime);
};
