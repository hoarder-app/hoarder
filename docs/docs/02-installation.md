# Installation

## Docker (Recommended)

### Requirements

- Docker
- Docker Compose

### 1. Create a new directory

Create a new directory to host the compose file and env variables.

### 2. Download the compose file

Download the docker compose file provided [here](https://github.com/MohamedBassem/hoarder-app/blob/main/docker/docker-compose.yml).

```
wget https://raw.githubusercontent.com/MohamedBassem/hoarder-app/main/docker/docker-compose.yml
```

### 3. Populate the environment variables

To configure the app, create a `.env` file in the directory and add this minimal env file:

```
NEXTAUTH_SECRET=super_random_string
HOARDER_VERSION=release
MEILI_MASTER_KEY=another_random_string
```

You **should** change the random strings. You can use `openssl rand -base64 36` to generate the random strings.

Persistent storage and the wiring between the different services is already taken care of in the docker compose file.

Keep in mind that every time you change the `.env` file, you'll need to re-run `docker compose up`.

If you want more config params, check the config documentation [here](/configuration).

### 4. Setup OpenAI

To enable automatic tagging, you'll need to configure OpenAI. This is optional though but hightly recommended.

- Follow [OpenAI's help](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key) to get an API key.
- Add `OPENAI_API_KEY=<key>` to the env file.

Learn more about the costs of using openai [here](/openai).


### 5. Start the service


Start the service by running:

```
docker compose up -d
```
