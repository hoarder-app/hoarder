# Configuration

The app is mainly configured by environment variables. All the used environment variables are listed in [packages/shared/config.ts](https://github.com/MohamedBassem/hoarder-app/blob/main/packages/shared/config.ts). The most important ones are:

| Name             | Required                              | Default   | Description                                                                                                                   |
| ---------------- | ------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| DATA_DIR         | Yes                                   | Not set   | The path for the persistent data directory. This is where the db and the uploaded assets live.                                |
| NEXTAUTH_SECRET  | Yes                                   | Not set   | Random string used to sign the JWT tokens. Generate one with `openssl rand -base64 36`.                                       |
| NEXTAUTH_URL     | Yes                                   | Not set   | The url on which the service will be running on. E.g. (`https://demo.hoarder.app`).                                           |
| REDIS_HOST       | Yes                                   | localhost | The address of redis used by background jobs                                                                                  |
| REDIS_POST       | Yes                                   | 6379      | The port of redis used by background jobs                                                                                     |
| OPENAI_API_KEY   | No                                    | Not set   | The OpenAI key used for automatic tagging. If not set, automatic tagging won't be enabled. More on that in [here](/openai).   |
| MEILI_ADDR       | No                                    | Not set   | The address of meilisearch. If not set, Search will be disabled. E.g. (`http://meilisearch:7700`)                                                              |
| MEILI_MASTER_KEY | Only in Prod and if search is enabled | Not set   | The master key configured for meilisearch. Not needed in development environment. Generate one with `openssl rand -base64 36` |
