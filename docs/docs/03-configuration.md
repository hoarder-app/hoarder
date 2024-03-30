# Configuration

The app is mainly configured by environment variables. All the used environment variables are listed in [packages/shared/config.ts](https://github.com/MohamedBassem/hoarder-app/blob/main/packages/shared/config.ts). The most important ones are:

| Name              | Required                              | Default   | Description                                                                                                                               |
| ----------------- | ------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| DATA_DIR          | Yes                                   | Not set   | The path for the persistent data directory. This is where the db and the uploaded assets live.                                            |
| NEXTAUTH_SECRET   | Yes                                   | Not set   | Random string used to sign the JWT tokens. Generate one with `openssl rand -base64 36`.                                                   |
| REDIS_HOST        | Yes                                   | localhost | The address of redis used by background jobs                                                                                              |
| REDIS_PORT        | Yes                                   | 6379      | The port of redis used by background jobs                                                                                                 |
| REDIS_DB_IDX      | No                                    | Not set   | The db idx to use with redis. It defaults to 0 (in the client) so you don't usually need to set it unless you explicitly want another db. |
| MEILI_ADDR        | No                                    | Not set   | The address of meilisearch. If not set, Search will be disabled. E.g. (`http://meilisearch:7700`)                                         |
| MEILI_MASTER_KEY  | Only in Prod and if search is enabled | Not set   | The master key configured for meilisearch. Not needed in development environment. Generate one with `openssl rand -base64 36`             |
| DISABLE_SIGNUPS   | No                                    | false     | If enabled, no new signups will be allowed and the signup button will be disabled in the UI                                               |
| MAX_ASSET_SIZE_MB | No                                    | 4         | Sets the maximum allowed asset size (in MB) to be uploaded                                                                                |

## Inference Configs (For automatic tagging)

Either `OPENAI_API_KEY` or `OLLAMA_BASE_URL` need to be set for automatic tagging to be enabled. Otherwise, automatic tagging will be skipped.

:::warning

- The quality of the tags you'll get will depend on the quality of the model you choose.
- Running local models is a recent addition and not as battle tested as using OpenAI, so proceed with care (and potentially expect a bunch of inference failures).
  :::

| Name                  | Required | Default              | Description                                                                                                                                                                                     |
| --------------------- | -------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY        | No       | Not set              | The OpenAI key used for automatic tagging. More on that in [here](/openai).                                                                                                                     |
| OPENAI_BASE_URL       | No       | Not set              | If you just want to use OpenAI you don't need to pass this variable. If, however, you want to use some other openai compatible API (e.g. azure openai service), set this to the url of the API. |
| OLLAMA_BASE_URL       | No       | Not set              | If you want to use ollama for local inference, set the address of ollama API here.                                                                                                              |
| INFERENCE_TEXT_MODEL  | No       | gpt-3.5-turbo-0125   | The model to use for text inference. You'll need to change this to some other model if you're using ollama.                                                                                     |
| INFERENCE_IMAGE_MODEL | No       | gpt-4-vision-preview | The model to use for image inference. You'll need to change this to some other model if you're using ollama and that model needs to support vision APIs (e.g. llava).                           |
