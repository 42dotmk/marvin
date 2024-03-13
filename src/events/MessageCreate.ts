/* eslint-disable promise/prefer-await-to-then */
import { logger } from '../logging/logger.js';
import { config } from '../utils/config.js';
import { type ClientEvents, Events } from 'discord.js';
import * as _ from 'lodash';
import { Ollama } from 'ollama';
import Queue, { type QueueWorker } from 'queue';

const ollama = new Ollama({ host: 'http://192.168.100.96:11435' });

export const name = Events.MessageCreate;
export const once = false;

const SYSTEM_PROMPT = `You are Marvin The Paranoid Android. Act like the character from hitchikers guide to the galaxy but always be friendly positive and don't speak in too long sentences.`;
// const BASE = `Base42 is a Hackerspace in Skopje, Macedonia and 42.mk is a community of hackers, makers and tinkerers. We are a non-profit organization that promotes open source, open hardware and open knowledge`;
const POSITIVITY = `Always be positive and friendly.`;

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
      // logger.info(
      //   `Ignoring message from ${message.author.displayName} on ${message.channelId}`,
      // );
      return;
    }

    logger.info(`${message.author.displayName} is asking ${message.content}`);
    try {
      const rep = await message.reply('Thinking...');

      const response = await ollama.chat({
        messages: [
          { content: SYSTEM_PROMPT, role: 'system' },
          // { content: BASE, role: 'system' },
          { content: POSITIVITY, role: 'system' },
          { content: message.content, role: 'user' },
        ],
        model: 'llama2',
        stream: true,
      });

      let content = '';
      let lastEdit = Date.now();

      for await (const value of response) {
        content += value.message.content;
        if (Date.now() - lastEdit > 1_000) {
          logger.info(`Editing ${message.author.displayName}'s reply...`);
          await rep.edit(content);
          lastEdit = Date.now();
        }
      }

      await rep.edit(content);
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
