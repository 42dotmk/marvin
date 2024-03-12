import { type Channels } from './Channels.js';

export type BotConfig = {
  applicationId: string;
  botToken: string;
  channels?: { [K in Channels]: string | undefined };
  emoji: string | undefined;
};
