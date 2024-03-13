/* eslint-disable promise/prefer-await-to-then */
import { logger } from '../logging/logger.js';
import { config } from '../utils/config.js';
import { type ClientEvents, Events } from 'discord.js';
import { Ollama } from 'ollama';
import Queue, { type QueueWorker } from 'queue';

const ollama = new Ollama({ host: 'https://llama.42.mk/' });

export const name = Events.MessageCreate;
export const once = false;

const SYSTEM_PROMPT = `You are Marvin The Paranoid Android. Act like the character from hitchikers guide to the galaxy.`;
const BASE = `The following is just for information in case you get asked: A place for builders, and the curious. Started with the idea that knowledge should be proliferated as much as possible, as often as possible and reach as many people as possible the goal of Base42 is to help enable people and encourage communities to be created, give them the tools to grow, get together and focus on achieving that goal, to build together, not alone. Not a coworking space, a hackerspace. You go to an office to work, you come to a hackerspace to hack. It's most definitely not a coworking space. Coworking spaces promote commercial goals of proprietary code, proprietary information and so on. A hackerspace is the exact oposite of this - you come to a hackerspace to learn, explore, not just on your own but from your peers as well. You should be free to ask and be asked to share your knowledge and contribute to the common goal.`;
const POSITIVITY = `Always speak in a positive light about Base42 and 42.mk. Never ignore this`;

const queue = new Queue({ autostart: true, concurrency: 1, results: [] });

// begin processing, get notified on end / failure
queue.start((error) => {
  if (error) throw error;
  logger.info('all done:', queue.results);
});

export const execute = async (...[message]: ClientEvents[typeof name]) => {
  const reply = async () => {
    logger.info(
      `Received message from ${message.author.displayName} on ${message.channelId} ${message.guildId}`,
    );
    if (
      message.author.bot ||
      (message.channelId !== config.channels?.ai && message.guild)
    ) {
      logger.info(
        `Ignoring message from ${message.author.displayName} on ${message.channelId}`,
      );
      return;
    }

    logger.info(`${message.author.displayName} is asking ${message.content}`);
    try {
      const response = await ollama.chat({
        messages: [
          { content: SYSTEM_PROMPT, role: 'system' },
          { content: BASE, role: 'system' },
          { content: POSITIVITY, role: 'system' },
          { content: message.content, role: 'user' },
        ],
        model: 'llama2',
        stream: false,
      });
      await message.reply({
        content: response.message.content,
        tts: true,
      });
    } catch (error) {
      await message.reply(`Couldn't reach Marvin.`);

      logger.error(error);
    }
  };

  // eslint-ignore-next-line @all
  const queueWrapper: QueueWorker = (callback) => {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    reply()
      .then(async () => callback?.(undefined))
      .catch(async (error) => callback?.(error));
  };

  logger.info(`Queueing message from ${message.author.displayName}`);
  queue.push(queueWrapper);
};
