import { GuildMember } from "discord.js";
import { Config } from "../config";

export async function removeRoles(member: GuildMember): Promise<void> {
  await member.roles.remove([Config.muteRoleId, Config.muteFromBotRoleId]);
}