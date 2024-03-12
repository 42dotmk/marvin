import { Client, GatewayIntentBits, Partials } from 'discord.js';

const intents = [
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageTyping,
  GatewayIntentBits.DirectMessageReactions,
  GatewayIntentBits.GuildMembers,
];

export const client = new Client({
  intents,
  partials: [Partials.Channel],
});
