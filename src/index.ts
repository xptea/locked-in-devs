import { GatewayIntentBits, GuildMember } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ExtendedClient } from './client';
import { Config } from './config';

dotenv.config();

const client = new ExtendedClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const commands: any[] = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { command } = await import(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

async function registerCommands() {
  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await registerCommands();

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  });

  client.once('ready', () => {
    console.log('Bot is online!');
  });

  client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member as GuildMember;
    if (!member || !newState.guild) return;

    const wasInLockedVC = oldState.channelId && Config.lockedVCIds.includes(oldState.channelId);
    const isInLockedVC = newState.channelId && Config.lockedVCIds.includes(newState.channelId);

    if (wasInLockedVC && !isInLockedVC) {
      if (member.roles.cache.has(Config.muteFromBotRoleId)) {
        await member.voice.setMute(false);
      }
    }

    if (!wasInLockedVC && isInLockedVC) {
      if (member.roles.cache.has(Config.muteFromBotRoleId)) {
        await member.voice.setMute(true);
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
})();
