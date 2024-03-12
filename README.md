# Marvin

Marvin is our wonderful Discord bot. It's made in [discord.js](https://github.com/discordjs/discord.js) v14. Requires Node.js ≥ 20 and PostgreSQL.

It's highly recommended to run this in a Docker environment if you want to retain your sanity.

## Live Demo

Join the [42.mk](https://42.mk/) Discord and chat in the `#marvin` channel.

## Authors

- Stefan Milev
- Ilija Boshkov

## Features

- Chat with Llama (Marvin)

## Installation

The project comes with several Docker Compose configurations:

- Use the `dev` configuration in your development environment or your dev container to utilize the hot reloading feature.
- Use the `prod` configuration to deploy the Discord bot somewhere in a production environment.
- Use the default configuration for light testing outside of a dev container.

If you happen to encounter issues inside the dev container with Prisma, then please run `npm run generate` to generate the Prisma client and its types.

### Installation (Development)
You likely want to run `npm run prepare` to install Husky and its pre-commit hooks for linting the codebase using ESLint. ESLint utilizes the [Canonical Style Config](https://github.com/gajus/eslint-config-canonical).

- `git clone https://github.com/42dotmk/marvin`
- `docker compose -f docker-compose.dev.yaml build` (or `docker compose build`)

### Installation (Production)

- `docker compose -f docker-compose.prod.yaml build`

### Installation (Outside Docker)

This is not recommended, but still possible. You need:

- Node.js

Once you have those:

- `git clone https://github.com/42dotmk/marvin`
- `npm run build`

## Running

The project requires a `.env` file containing the environment variables in the `.env.sample` file. You should rename that file and modify it to your needs. Some features may not work if you do not specify all environment variables.

### Running (Development)

- `docker compose -f docker-compose.dev.yaml up -d` (or `docker compose up -d`)

### Running (Production)

- `docker compose -f docker-compose.prod.yaml up -d`

### Running (Outside Docker)

- `npm run start`

## Logging

The project logs all interactions and related output into the `bot.log` file, as well as the console.
