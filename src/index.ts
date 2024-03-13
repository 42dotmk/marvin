import { logger } from './logging/logger.js';
import { messages } from './translations/messages.js';
import { client } from './utils/client.js';
import { config } from './utils/config.js';
import { attachEventListeners } from './utils/events.js';

logger.info(messages.starting);

logger.info(`Listening on ${config.channels?.ai}`);

await attachEventListeners();

logger.info('Logging in');
await client.login(config.botToken);
logger.info('Logged in');
