################# The Web App ##############

# Rebuild the source code only when needed
FROM node:21-alpine AS web_builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY packages/db packages/db
COPY packages/web packages/web
COPY packages/shared packages/shared
COPY package.json yarn.lock .yarnrc.yml .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable && \
    cd /app/packages/db && \
    yarn dlx prisma generate && \
    cd /app/packages/web/ && \
    yarn install --immutable && \
    yarn next experimental-compile

FROM node:21-alpine AS web
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=web_builder --chown=node:node /app/packages/web/.next/standalone ./
COPY --from=web_builder /app/packages/web/public ./packages/web/public

# Set the correct permission for prerender cache
RUN mkdir -p ./package/web/.next
RUN chown node:node ./packages/web/.next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=web_builder --chown=node:node /app/packages/web/.next/static ./packages/web/.next/static

WORKDIR /app/packages/web
USER root
EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

################# The workers builder ##############

FROM node:21-alpine AS workers_builder
WORKDIR /app

# Install chromium needed for puppeteer
RUN apk add --no-cache make g++ py3-pip linux-headers

COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/workers/package.json packages/workers/package.json
COPY package.json yarn.lock .yarnrc.yml .

RUN corepack enable && \
    cd /app/packages/workers && \
    yarn workspaces focus --production && \
    cd /app/packages/db && \
    yarn dlx prisma generate


################# The workers ##############

FROM node:21-alpine AS workers
WORKDIR /app

# Install chromium needed for puppeteer
RUN apk add --no-cache chromium runuser
ENV PUPPETEER_SKIP_DOWNLOAD true
ENV CHROME_PATH "/usr/bin/chromium-browser"
ENV BROWSER_EXECUTABLE_PATH "/app/start-chrome.sh"
ENV BROWSER_USER_DATA_DIR="/tmp/chrome"

ADD docker/start-chrome.sh .
RUN chmod +x /app/start-chrome.sh

COPY packages/db packages/db
COPY packages/shared packages/shared
COPY packages/workers packages/workers
COPY package.json yarn.lock .yarnrc.yml .
COPY --from=workers_builder /app/node_modules /app/node_modules

RUN corepack enable && cd packages/db && yarn dlx prisma generate

WORKDIR /app/packages/workers
USER root

CMD ["yarn", "run", "start:prod"]
