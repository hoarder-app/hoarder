<div align="center">
    <a href="https://github.com/hoarder-app/hoarder/actions/workflows/ci.yml">
        <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/hoarder-app/hoarder/ci.yml" />
    </a>
    <a href="https://github.com/hoarder-app/hoarder/releases">
        <img alt="GitHub Release" src="https://img.shields.io/github/v/release/hoarder-app/hoarder" />
    </a>
    <a href="https://discord.gg/NrgeYywsFh">
        <img alt="Discord" src="https://img.shields.io/discord/1223681308962721802?label=chat%20on%20discord" />
    </a>
    <a href="https://hosted.weblate.org/engage/hoarder/">
        <img src="https://hosted.weblate.org/widget/hoarder/hoarder/svg-badge.svg" alt="Translation status" />
    </a>
</div>

# <img height="50px" src="./screenshots/logo.png" />

A self-hostable bookmark-everything app with a touch of AI for the data hoarders out there.

> *Hoarder is an independent, non-commercial project. It is not affiliated with, endorsed by, or connected to Hordr.app or its owners.*

![homepage screenshot](https://github.com/hoarder-app/hoarder/blob/main/screenshots/homepage.png?raw=true)

## Features

- 🔗 Bookmark links, take simple notes and store images and pdfs.
- ⬇️ Automatic fetching for link titles, descriptions and images.
- 📋 Sort your bookmarks into lists.
- 🔎 Full text search of all the content stored.
- ✨ AI-based (aka chatgpt) automatic tagging. With supports for local models using ollama!
- 🎆 OCR for extracting text from images.
- 🔖 [Chrome plugin](https://chromewebstore.google.com/detail/hoarder/kgcjekpmcjjogibpjebkhaanilehneje) and [Firefox addon](https://addons.mozilla.org/en-US/firefox/addon/hoarder/) for quick bookmarking.
- 📱 An [iOS app](https://apps.apple.com/us/app/hoarder-app/id6479258022), and an [Android app](https://play.google.com/store/apps/details?id=app.hoarder.hoardermobile&pcampaignid=web_share).
- 📰 Auto hoarding from RSS feeds.
- 🔌 REST API.
- 🌐 Mutli-language support.
- 🖍️ Mark and store highlights from your hoarded content.
- 🗄️ Full page archival (using [monolith](https://github.com/Y2Z/monolith)) to protect against link rot. Auto video archiving using [youtube-dl](https://github.com/marado/youtube-dl).
- ☑️ Bulk actions support.
- 🔐 SSO support.
- 🌙 Dark mode support.
- 💾 Self-hosting first.
- [Planned] Downloading the content for offline reading in the mobile app.

**⚠️ This app is under heavy development and it's far from stable.**

## Documentation

- [Installation](https://docs.hoarder.app/Installation/docker)
- [Configuration](https://docs.hoarder.app/configuration)
- [Screenshots](https://docs.hoarder.app/screenshots)
- [Security Considerations](https://docs.hoarder.app/security-considerations)
- [Development](https://docs.hoarder.app/Development/setup)
- [Self-Hosting Instructions](https://docs.hoarder.app/Installation/docker)

## Demo

You can access the demo at [https://try.hoarder.app](https://try.hoarder.app). Login with the following creds:

```
email: demo@hoarder.app
password: demodemo
```

The demo is seeded with some content, but it's in read-only mode to prevent abuse.

## Self-Hosting with Docker Compose

To self-host the Hoarder app, follow these steps:

1. **Create a new directory** 📁: Create a new directory to host the compose file and environment variables.
2. **Download the compose file** 📥: Download the Docker Compose file provided here or use the command:
    ```bash
    wget https://raw.githubusercontent.com/hoarder-app/hoarder/main/docker/docker-compose.yml
    ```
3. **Populate the environment variables** 📝: Create a `.env` file in the directory and add the following minimal environment variables:
    ```bash
    HOARDER_VERSION=release
    NEXTAUTH_SECRET=super_random_string
    MEILI_MASTER_KEY=another_random_string
    NEXTAUTH_URL=http://localhost:3000
    ```
    You can use `openssl rand -base64 36` to generate the random strings. Change the `NEXTAUTH_URL` variable to point to your server address.
4. **Setup OpenAI (optional)** 🤖: To enable automatic tagging, configure OpenAI by adding the API key to the `.env` file:
    ```bash
    OPENAI_API_KEY=<key>
    ```
5. **Start the service** 🚀: Run the following command to start the service:
    ```bash
    docker compose up -d
    ```
6. **Access the service** 🌐: Visit `http://localhost:3000` to access the Hoarder app.

Here is the single bash command that captures all the steps:

```bash
eof
mkdir hoarder-app && cd hoarder-app && wget https://raw.githubusercontent.com/hoarder-app/hoarder/main/docker/docker-compose.yml && echo -e "HOARDER_VERSION=release\nNEXTAUTH_SECRET=$(openssl rand -base64 36)\nMEILI_MASTER_KEY=$(openssl rand -base64 36)\nNEXTAUTH_URL=http://localhost:3000" > .env && docker compose up -d
eof
```

## Stack

- [NextJS](https://nextjs.org/) for the web app. Using app router.
- [Drizzle](https://orm.drizzle.team/) for the database and its migrations.
- [NextAuth](https://next-auth.js.org) for authentication.
- [tRPC](https://trpc.io) for client->server communication.
- [Puppeteer](https://pptr.dev/) for crawling the bookmarks.
- [OpenAI](https://openai.com/) because AI is so hot right now.
- [Meilisearch](https://meilisearch.com) for the full content search.

## Why did I build it?

I browse reddit, twitter and hackernews a lot from my phone. I frequently find interesting stuff (articles, tools, etc) that I'd like to bookmark and read later when I'm in front of a laptop. Typical read-it-later apps usecase. Initially, I was using [Pocket](https://getpocket.com) for that. Then I got into self-hosting and I wanted to self-host this usecase. I used [memos](https://github.com/usememos/memos) for those quick notes and I loved it but it was lacking some features that I found important for that usecase such as link previews and automatic tagging (more on that in the next section).

I'm a systems engineer in my day job (and have been for the past 7 years). I didn't want to get too detached from the web development world. I decided to build this app as a way to keep my hand dirty with web development, and at the same time, build something that I care about and use every day.

## Alternatives

- [memos](https://github.com/usememos/memos): I love memos. I have it running on my home server and it's one of my most used self-hosted apps. It doesn't, however, archive or preview the links shared in it. It's just that I dump a lot of links there and I'd have loved if I'd be able to figure which link is that by just looking at my timeline. Also, given the variety of things I dump there, I'd have loved if it does some sort of automatic tagging for what I save there. This is exactly the usecase that I'm trying to tackle with Hoarder.
- [mymind](https://mymind.com/): Mymind is the closest alternative to this project and from where I drew a lot of inspirations. It's a commercial product though.
- [raindrop](https://raindrop.io): A polished open source bookmark manager that supports links, images and files. It's not self-hostable though.
- Bookmark managers (mostly focused on bookmarking links):
    - [Pocket](https://getpocket.com): Pocket is what hooked me into the whole idea of read-it-later apps. I used it [a lot](https://blog.mbassem.com/2019/01/27/favorite-articles-2018/). However, I recently got into home-labbing and became obsessed with the idea of running my services in my home server. Hoarder is meant to be a self-hosting first app.
    - [Linkwarden](https://linkwarden.app/): An open-source self-hostable bookmark manager that I ran for a bit in my homelab. It's focused mostly on links and supports collaborative collections.
    - [Omnivore](https://omnivore.app/): Omnivore is pretty cool open source read-it-later app. Unfortunately, it's heavily dependent on google cloud infra which makes self-hosting it quite hard. They published a [blog post](https://docs.omnivore.app/self-hosting/self-hosting.html) on how to run a minimal omnivore but it was lacking a lot of stuff. Self-hosting doesn't really seem to be a high priority for them, and that's something I care about, so I decided to build an alternative.
    - [Wallabag](https://wallabag.it): Wallabag is a well-established open source read-it-later app written in php and I think it's the common recommendation on reddit for such apps. To be honest, I didn't give it a real shot, and the UI just felt a bit dated for my liking. Honestly, it's probably much more stable and feature complete than this app, but where's the fun in that?
    - [Shiori](https://github.com/go-shiori/shiori): Shiori is meant to be an open source pocket clone written in Go. It ticks all the marks but doesn't have my super sophisticated AI-based tagging. (JK, I only found about it after I decided to build my own app, so here we are 🤷).

## Translations

Hoarder uses Weblate for managing translations. If you want to help translate Hoarder, you can do so [here](https://hosted.weblate.org/engage/hoarder/).

## Support

If you're enjoying using Hoarder, drop a ⭐️ on the repo!

<a href="https://www.buymeacoffee.com/mbassem" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hoarder-app/hoarder&type=Date)](https://star-history.com/#hoarder-app/hoarder&Date)
