# Development stage
FROM --platform=${BUILDPLATFORM} node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache git nodejs

COPY package.json package-lock.json ./
RUN npm i --ignore-scripts

COPY . ./
RUN npm run build

CMD [ "npm", "run", "dev" ]

# Production stage
FROM --platform=${TARGETPLATFORM} node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache

COPY package.json package-lock.json ./

COPY --from=development /app/node_modules ./node_modules
RUN npm prune --production

COPY --from=development /app/dist ./dist

CMD [ "node", "dist/index.js" ]
