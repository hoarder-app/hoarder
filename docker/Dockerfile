################# Base Builder ##############
FROM --platform=$BUILDPLATFORM node:21-alpine AS base

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

# Build the db migration script
RUN cd packages/db && \
    pnpm dlx @vercel/ncc build migrate.ts -o /db_migrations && \
    cp -R drizzle /db_migrations


################# The Web builder ##############

# Rebuild the source code only when needed
FROM base AS web_builder

WORKDIR /app/apps/web

RUN pnpm next experimental-compile

################# The Web App ##############

FROM --platform=$BUILDPLATFORM node:21-alpine AS web
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=web_builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=web_builder /app/apps/web/public ./apps/web/public
COPY --from=web_builder /db_migrations /db_migrations

# Set the correct permission for prerender cache
RUN mkdir -p ./apps/web/.next
RUN chown node:node ./apps/web/.next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=web_builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

WORKDIR /app/apps/web
USER root
EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["/bin/sh", "-c", "(cd /db_migrations && node index.js) && node server.js"]

################# The workers builder ##############

FROM base AS workers_builder

RUN --mount=type=cache,id=pnpm_workers,target=/pnpm/store pnpm deploy --node-linker=isolated --filter @hoarder/workers --prod /prod

################# The workers ##############

FROM --platform=$BUILDPLATFORM node:21-alpine AS workers
WORKDIR /app

# Install chromium needed for puppeteer
RUN apk add --no-cache chromium runuser
ENV CHROME_PATH "/usr/bin/chromium-browser"
ENV BROWSER_EXECUTABLE_PATH "/app/start-chrome.sh"
ENV BROWSER_USER_DATA_DIR="/tmp/chrome"

COPY --from=workers_builder /prod apps/workers

RUN corepack enable

ADD docker/start-chrome.sh .
RUN chmod +x start-chrome.sh

WORKDIR /app/apps/workers

USER root

CMD ["pnpm", "run", "start:prod"]
