import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember } from 'discord.js';
import { Config } from '../config';

export const command = {
  data: new SlashCommandBuilder()
    .setName('lockuser')
    .setDescription('Lock or unlock a user in a locked VC')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to lock/unlock')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('mute')
        .setDescription('Mute the user?')
        .setRequired(true)),

  async execute(interaction: CommandInteraction) {
    const userOption = interaction.options.get('user', true)?.user;
    const memberId = userOption?.id ?? null;
    const mute = interaction.options.get('mute', true)?.value as boolean;

    const guild = interaction.guild;
    if (!guild || !memberId) {
      return interaction.reply({ content: 'Invalid user or guild!', ephemeral: true });
    }

    const guildMember = await guild.members.fetch(memberId) as GuildMember;

    const voiceChannelId = guildMember.voice.channel?.id;
    const inLockedVC = voiceChannelId && Config.lockedVCIds.includes(voiceChannelId);

    if (mute) {
      if (!inLockedVC) {
        return interaction.reply({ content: 'User is not in a locked VC!', ephemeral: true });
      }

      console.log(`Attempting to mute ${guildMember.user.tag}`);

      await guildMember.roles.add(Config.muteRoleId);
      await guildMember.roles.add(Config.muteFromBotRoleId);

      await guildMember.voice.setMute(true);

      console.log(`Muted roles for ${guildMember.user.tag}:`, guildMember.roles.cache.map(role => role.name));

      return interaction.reply({ content: `${guildMember.user.tag} has been muted.`, ephemeral: true });
    } else {
      if (guildMember.roles.cache.has(Config.muteRoleId) && guildMember.roles.cache.has(Config.muteFromBotRoleId)) {
        await guildMember.roles.remove(Config.muteRoleId);
        await guildMember.roles.remove(Config.muteFromBotRoleId);

        await guildMember.voice.setMute(false);

        return interaction.reply({ content: `${guildMember.user.tag} has been unmuted.`, ephemeral: true });
      } else {
        return interaction.reply({ content: `${guildMember.user.tag} is not muted by the bot.`, ephemeral: true });
      }
    }
  },
};
