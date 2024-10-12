import { GatewayIntentBits, GuildMember } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ExtendedClient } from "./client";
import { Config } from "./config";
import { cancelTimer, startTimer } from "./utils/LockinTimer";

dotenv.config();

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commands: any[] = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { command } = await import(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log("Started refreshing application (/) commands.");

    const data = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands }
    )) as { length: number };

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  await registerCommands();

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  client.once("ready", () => {
    console.log("Bot is online!");
  });

  client.on("voiceStateUpdate", async (oldState, newState) => {
    const member = newState.member as GuildMember;
    const userId = member.id;
    const isMuted = member.voice.mute;

    if (!member || !newState.guild) return;

    const isInLockedVC =
      newState.channelId && Config.lockedVCIds.includes(newState.channelId);
    const hasStartedStreaming = !oldState.streaming && newState.streaming;
    const hasStoppedStreaming = oldState.streaming && !newState.streaming;
    const hasLeftVC = oldState.channelId && !newState.channelId;
    const hasMuteRole = member.roles.cache.has(Config.muteRoleId);

    if (hasMuteRole) {
      const shouldBeMuted = Boolean(isInLockedVC);
      if (isMuted !== shouldBeMuted) {
        await member.voice.setMute(shouldBeMuted);
      }

      if (isInLockedVC && hasStartedStreaming) {
        startTimer(userId, member);
      }

      if (hasStoppedStreaming || hasLeftVC) {
        cancelTimer(userId);
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
})();
