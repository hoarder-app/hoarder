################# Base Builder ##############
FROM node:21-alpine AS base

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat make g++ py3-pip linux-headers

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV PUPPETEER_SKIP_DOWNLOAD true
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

################# The Web builder ##############

# Rebuild the source code only when needed
FROM base AS web_builder

WORKDIR /app/packages/web

RUN pnpm next experimental-compile

################# The Web App ##############

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

FROM base AS workers_builder

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm deploy --filter @hoarder/workers --prod /prod

################# The workers ##############

FROM node:21-alpine AS workers
WORKDIR /app

# Install chromium needed for puppeteer
RUN apk add --no-cache chromium runuser
ENV CHROME_PATH "/usr/bin/chromium-browser"
ENV BROWSER_EXECUTABLE_PATH "/app/start-chrome.sh"
ENV BROWSER_USER_DATA_DIR="/tmp/chrome"

COPY --from=workers_builder /prod packages/workers

RUN corepack enable

ADD docker/start-chrome.sh .
RUN chmod +x start-chrome.sh

WORKDIR /app/packages/workers

USER root

CMD ["pnpm", "run", "start:prod"]
