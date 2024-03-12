import { logger } from '../logging/logger.js';
import { messages } from '../translations/messages.js';
import { Events } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

export const execute = async () => {
  logger.info(messages.botIsReady);
};
