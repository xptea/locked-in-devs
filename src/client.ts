import { Client, Collection } from 'discord.js';

interface Command {
  data: any;
  execute: Function;
}

export class ExtendedClient extends Client {
  commands: Collection<string, Command> = new Collection();
}
