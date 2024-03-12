import { logger } from '../logging/logger.js';
import { config } from '../utils/config.js';
import { type ClientEvents, Events } from 'discord.js';
import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'https://llama.42.mk/' });
export const name = Events.MessageCreate;
export const once = false;

export const execute = async (...[message]: ClientEvents[typeof name]) => {
  if (message.author.bot || message.channelId === config.channels?.ai) {
    return;
  }

  logger.info(`${message.author.displayName} is asking ${message.content}`);
  try {
    const response = await ollama.chat({
      messages: [{ content: message.content, role: 'user' }],
      model: 'llama2',
      stream: false,
    });
    await message.channel.send(response.message.content);
  } catch (error) {
    await message.channel.send(`Couldn't reach Marvin.`);

    logger.error(error);
  }
};
