/* eslint-disable n/no-process-env */
/* eslint-disable promise/prefer-await-to-then */
import { logger } from '../logging/logger.js';
import { config } from '../utils/config.js';
import {
  ChannelType,
  type ClientEvents,
  Events,
  type Message,
} from 'discord.js';
import { type ChatResponse, Ollama } from 'ollama';
import Queue, { type QueueWorker } from 'queue';
// eslint-disable-next-line import/no-extraneous-dependencies
import { throttle } from 'underscore';

const { env } = process;

const LLAMA_URL = env['LLAMA_URL'] ?? 'http://192.168.100.248';
const PROMPT =
  env['SYSTEM_PROMPT'] ??
  `You are Marvin an assistant, inspired by The Hitchhiker's Guide to the Galaxy. The messages sent to you will be by multiple users prefixed with their name and 'says :' (Example: 'John says:') respond to anything they ask. The prefix "name says:" is only for your information do not reply in the same way. Do not start your replies with "Marvin:". You are replying to the messages directly, be direct. Be respectful. Do not roleplay. Do not write more than 2 paragraphs. Do not use the phrase adjusts glasses. EVER.`;
const MODEL = env['MODEL'] ?? 'mistral:7b';
const THROTTLE_TIME = Number.parseInt(env['THROTTLE_TIME'] ?? '100', 10);

const ollama = new Ollama({
  host: LLAMA_URL,
});

export const name = Events.MessageCreate;
export const once = false;

const queue = new Queue({ autostart: true, concurrency: 1, results: [] });

queue.start((error) => {
  if (error) throw error;
  logger.info('all done:', queue.results);
});

const SYSTEM_PROMPT = {
  content: PROMPT,
  role: 'system',
};

logger.info(`Using ${MODEL} model from ${LLAMA_URL} for AI responses`);
logger.info(`Using prompt: '${PROMPT}'`);
logger.info(`Using message edit throttle time: ${THROTTLE_TIME}ms`);

const context: Array<{ content: string; role: string }> = [];

const streamResponse = async (
  message: Message<boolean>,
  response: AsyncGenerator<ChatResponse>,
): Promise<string> => {
  let rep = message;
  const updateResponse = throttle(
    async (messageToEdit: Message<boolean>, repContent: string) => {
      const start = Date.now();
      await messageToEdit.edit(repContent);
      logger.info(
        `Edited message in ${Date.now() - start}ms on ${messageToEdit.channelId}`,
      );
    },
    THROTTLE_TIME,
  );

  let content = '';

  for await (const value of response) {
    content += value.message.content;
    logger.debug(value.message.content);
    if (content.length > 1_500) {
      await updateResponse(rep, rep.content.slice(0, 1_500));
      content = content.slice(1_500);
      rep = await rep.reply(content);
    }

    await updateResponse(rep, content);
  }

  return content;
};

export const execute = async (...[message]: ClientEvents[typeof name]) => {
  const reply = async () => {
    logger.info(
      `Received message from ${message.author.displayName} on ${message.channelId}/${config.channels?.ai} ${message.guildId}`,
    );
    if (
      message.author.bot ||
      (message.channel.type !== ChannelType.DM &&
        message.channelId !== config.channels?.ai)
    ) {
      logger.info(
        `Ignoring message from ${message.author.displayName} on ${message.channelId}`,
      );
      return;
    }

    logger.info(`${message.author.displayName} is asking ${message.content}`);
    try {
      const rep = await message.reply('(Thinking...)');
      const writtenMessage = `${message.author.displayName} says: ${message.content}`;

      if (context.length > 30) {
        context.shift();
      }

      context.push({ content: writtenMessage, role: 'user' });

      const response = await ollama.chat({
        messages: [SYSTEM_PROMPT, ...context],
        model: MODEL,
        stream: true,
      });

      const content = await streamResponse(rep, response);

      context.push({ content, role: 'assistant' });
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

  queue.push(queueWrapper);
};
