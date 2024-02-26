# <img width="25px" src="./screenshots/logo.png" /> Hoarder

A self-hostable bookmark-everything app with a touch of AI for the data hoarders out there.

![homepage screenshot](https://github.com/MohamedBassem/hoarder-app/blob/main/screenshots/homepage.png?raw=true)

## Features

- 🔗 Bookmark links.
- ⬇️ Automatic fetching for link titles, descriptions and images.
- ✨ AI-based (aka chatgpt) automatic tagging.
- 🔖 Chrome plugin for quick bookmarking.
- 📱 iOS shortcut for bookmarking content from the phone. A minimal mobile app might come later.
- 💾 Self-hostable first.
- [Planned] Archiving the content for offline reading.
- [Planned] Full text search of all the content stored.
- [Planned] Store raw notes and images.

**⚠️ This app is under heavy development and it's far from stable.**

## Installation

Docker is the recommended way for deploying the app. A docker compose file is provided.

Run `docker compose up` then head to `http://localhost:3000` to access the app.

> NOTE: You'll need to set the env variable `OPENAI_API_KEY` without your own openai key for automatic tagging to work. Check the next section for config details.

## Configuration

The app is configured with env variables.

| Name           | Default   | Description                                                                                                                                                                                                                                       |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY | Not set   | The OpenAI key used for automatic tagging. If not set, automatic tagging won't be enabled. The app currently uses `gpt-3.5-turbo-0125` which is [extremely cheap](https://openai.com/pricing). You'll be able to bookmark 1000+ for less than $1. |
| DATABASE_FILE  | Not set   | The path for the sqlite database.                                                                                                                                                                                                                 |
| REDIS_HOST     | localhost | The address of redis used by background jobs                                                                                                                                                                                                      |
| REDIS_POST     | 6379      | The port of redis used by background jobs                                                                                                                                                                                                         |

## Security Considerations

If you're going to give app access to untrusted users, there's some security considerations that you'll need to be aware of given how the crawler works. The crawler is basically running a browser to fetch the content of the bookmarks. Any untrusted user can submit bookmarks to be crawled from your server and they'll be able to see the crawling result. This can be abused in multiple ways:

1. Untrused users can submit crawl requests to websites that you don't want to be coming out of your IPs.
2. Crawling user controlled websites can expose your origin IP (and location) even if your service is hosted behind cloudflare for example.
3. The crawling requests will be coming out from your own network, which untrusted users can leverage to crawl internal non-internet exposed endpoints.

To mitigate those risks, you can do one of the following:

1. Limit access to trusted users
2. Let the browser traffic go through some VPN with restricted network policies.
3. Host the browser container outside of your network.
4. Use a hosted browser as a service (e.g. [browserless](https://browserless.io)). Note: I've never used them before.

## Stack

- [NextJS](https://nextjs.org/) for the web app. Using app router.
- [Drizzle](https://orm.drizzle.team/) for the database and its migrations.
- [NextAuth](https://next-auth.js.org) for authentication.
- [tRPC](https://trpc.io) for client->server communication.
- [Puppeteer](https://pptr.dev/) for crawling the bookmarks.
- [OpenAI](https://openai.com/) because AI is so hot right now.
- [BullMQ](https://bullmq.io) for scheduling the background jobs.

## Why did I build it?

I browse reddit, twitter and hackernews a lot from my phone. I frequently find interesting stuff (articles, tools, etc) that I'd like to bookmark and read later when I'm in front of a laptop. Typical read-it-later apps usecase. Initially, I was using [Pocket](getpocket.com) for that. Then I got into self-hosting and I wanted to self-host this usecase. I used [memos](https://github.com/usememos/memos) for those quick notes and I loved it but it was lacking some features that I found important for that usecase such as link previews and automatic tagging (more on that in the next section).

I'm a systems engineer in my day job (and have been for the past 7 years). I didn't want to get too detached from the web development world. I decided to build this app as a way to keep my hand dirty with web development, and at the same time, build something that I care about and will use everyday.

## Why not X?

- [Pocket](getpocket.com): Pocket is what hooked me into the whole idea of read-it-later apps. I used it [a lot](https://blog.mbassem.com/2019/01/27/favorite-articles-2018/). However, I recently got into home-labbing and became obsessed with the idea of running my services in my home server. Hoarder is meant to be a self-hosting first app.
- [Omnivore](https://omnivore.app/): Omnivore is pretty cool open source read-it-later app. Unfortunately, it's heavily dependent on google cloud infra which makes self-hosting it quite hard. They published a [blog post](https://docs.omnivore.app/self-hosting/self-hosting.html) on how to run a minimal omnivore but it was lacking a lot of stuff. Self-hosting doesn't really seem to be a high priority for them, and that's something I care about, so I decided to build an alternative.
- [Instapaper](https://www.instapaper.com/): Not open source and not self-hostable.
- [memos](https://github.com/usememos/memos): I love memos. I have it running on my home server and it's one of my most used self-hosted apps. I, however, don't like the fact that it doesn't preview the content of the links I dump there and to be honest, it doesn't have to because that's not what it was designed for. It's just that I dump a lot of links there and I'd have loved if I'd be able to figure which link is that by just looking at my timeline. Also, given the variety of things I dump there, I'd have loved if it does some sort of automatic tagging for what I save there. This is exactly the usecase that I'm trying to tackle with Hoarder.
- [Wallabag](https://wallabag.it): Wallabag is a well-established open source read-it-later app written in php and I think it's the common recommendation on reddit for such apps. To be honest, I didn't give it a real shot, and the UI just felt a bit dated for my liking. Honestly, it's probably much more stable and feature complete than this app, but where's the fun in that?
- [Shiori](https://github.com/go-shiori/shiori): Shiori is meant to be an open source pocket clone written in Go. It ticks all the marks but doesn't have my super sophisticated AI-based tagging. (JK, I only found about it after I decided to build my own app, so here we are 🤷).

## Development

### Docker

You can turnup the whole development environment with:
`docker compose -f docker/docker-compose.dev.yml up`

### Manual

Or if you have nodejs installed locally, you can do:

- `pnpm install` in the root of the repo.
- `pnpm db:migrate` to run the db migrations.
- `pnpm web` to start the web app.
  - Access it over `http://localhost:3000`.
- `pnpm workers` to start the crawler and the openai worker.
  - You'll need to have redis running at `localhost:5379` (configurable with env variables).
  - An easy way to get redis running is by using docker `docker run -p 5379:5379 redis`.
  - You can run the web app without the workers, but link fetching and automatic tagging won't work.

### Codebase structure

- `packages/db`: Where drizzle's schema lives. Shared between packages.
- `packages/shared`: Shared utilities and code between the workers and the web app.
- `packages/web`: Where the nextjs based web app lives.
- `packages/workers`: Where the background job workers (crawler and openai as of now) run.

### Submitting PRs

- Before submitting PRs, you'll want to run `pnpm format` and include its changes in the commit. Also make sure `pnpm lint` is successful.
