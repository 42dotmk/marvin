// eslint-disable-next-line import/no-unassigned-import
import 'dotenv/config';
import { type BotConfig } from '../types/BotConfig.js';
// eslint-disable-next-line n/prefer-global/process
import { env } from 'node:process';

// Check for required environment variables

if (!env['APPLICATION_ID']) {
  throw new Error(
    'The application ID is not defined. Please define the APPLICATION_ID environment variable.',
  );
}

if (!env['BOT_TOKEN']) {
  throw new Error(
    'The bot token is not defined. Please define the BOT_TOKEN environment variable.',
  );
}

export const config: BotConfig = {
  applicationId: env['APPLICATION_ID'] ?? '',
  botToken: env['BOT_TOKEN'] ?? '',
  channels: {
    ai: env['CHANNEL_GENERAL'],
    general: env['CHANNEL_AI'],
  },
  emoji: env['EMOJI'],
};
