/* eslint-disable n/no-process-env */
/* eslint-disable promise/prefer-await-to-then */
import { logger } from '../logging/logger.js';
import { config } from '../utils/config.js';
import { type ClientEvents, Events } from 'discord.js';
import { Ollama } from 'ollama';
import Queue, { type QueueWorker } from 'queue';

const { env } = process;

const ollama = new Ollama({
  host: env['LLAMA_URL'] ?? 'http://192.168.100.96:11435',
});

export const name = Events.MessageCreate;
export const once = false;

const queue = new Queue({ autostart: true, concurrency: 1, results: [] });

const ENV_PROMPT =
  // eslint-disable-next-line n/no-process-env
  env['SYSTEM_PROMPT'] ??
  `You are Marvin an assistant, inspired by The Hitchhiker's Guide to the Galaxy. The messages sent to you will be by multiple users prefixed with their name and 'says :' (Example: 'John says:') respond to anything they ask. The prefix "name says:" is only for your information do not reply in the same way. Do not start your replies with "Marvin:". You are replying to the messages directly, be direct. Be respectful. Do not roleplay. Do not write more than 2 paragraphs. Do not use the phrase adjusts glasses. EVER.`;

// begin processing, get notified on end / failure
queue.start((error) => {
  if (error) throw error;
  logger.info('all done:', queue.results);
});

const SYSTEM_PROMPT = {
  content: ENV_PROMPT,
  role: 'system',
};

const context: Array<{ content: string; role: string }> = [];

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
      const rep = await message.reply(
        'https://media.tenor.com/wpSo-8CrXqUAAAAi/loading-loading-forever.gif',
      );
      const writtenMessage = `${message.author.displayName} says: ${message.content}`;

      if (context.length > 30) {
        context.shift();
      }

      context.push({ content: writtenMessage, role: 'user' });

      const response = await ollama.chat({
        messages: [SYSTEM_PROMPT, ...context],
        model: 'mistral:7b',
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

      context.push({ content, role: 'assistant' });
      await rep.edit(content);
    } catch (error) {
      await message.reply(
        `https://tenor.com/view/falling-star-wars-robot-gif-20159502`,
      );

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
