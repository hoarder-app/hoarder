# Minimal Installation

:::warning
Unless necessary, prefer the [full installation](/Installation/docker) to leverage all the features of hoarder. You'll be sacrificing a lot of functionality if you go with the minimal installation route.
:::

Hoarder's default installation has a dependency on Meilisearch for the full text search, Chrome for crawling and OpenAI/Ollama for AI tagging. You can however run hoarder without those dependencies if you're willing to sacrifice those features.

- If you run without meilisearch, the search functionality will be completely disabled.
- If you run without chrome, crawling will still work, but you'll lose ability to take screenshots of websites and websites with javascript content won't get crawled correctly.
- If you don't setup OpenAI/Ollama, AI tagging will be disabled.

Those features are important for leveraging hoarder's full potential, but if you're running in constrained environments, you can use the following minimal docker compose to skip all those dependencies:

```yaml
services:
  web:
    image: ghcr.io/hoarder-app/hoarder:release
    restart: unless-stopped
    volumes:
      - data:/data
    ports:
      - 3000:3000
    environment:
      DATA_DIR: /data
      NEXTAUTH_SECRET: super_random_string
volumes:
  data:
```

Or just with the following docker command:

```base
docker run -d \
  --restart unless-stopped \
  -v data:/data \
  -p 3000:3000 \
  -e DATA_DIR=/data \
  -e NEXTAUTH_SECRET=super_random_string \
  ghcr.io/hoarder-app/hoarder:release
```

:::warning
You **MUST** change the `super_random_string` to a true random string which you can generate with `openssl rand -hex 32`.
:::

Check the [configuration docs](/configuration) for extra features to enable such as full page archival, full page screenshots, inference languages, etc.


