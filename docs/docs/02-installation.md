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
$ wget https://raw.githubusercontent.com/MohamedBassem/hoarder-app/main/docker/docker-compose.yml
```

### 3. Populate the environment variables

You can use the env file template provided [here](https://github.com/MohamedBassem/hoarder-app/blob/main/.env.sample) and fill it manually using the documentation [here](/configuration).

```
$ wget https://raw.githubusercontent.com/MohamedBassem/hoarder-app/main/.env.sample
$ mv .env.sample .env
```

Alternatively, here is a minimal `.env` file to use:

```
NEXTAUTH_SECRET=super_random_string
NEXTAUTH_URL=<YOUR DEPLOYED URL>

HOARDER_VERSION=release

MEILI_ADDR=http://meilisearch:7700
MEILI_MASTER_KEY=another_random_string
```

You can use `openssl rand -base64 36` to generate the random strings.

Persistent storage and the wiring between the different services is already taken care of in the docker compose file.

### 4. Setup OpenAI

To enable automatic tagging, you'll need to configure open ai. This is optional though but hightly recommended.

- Follow [OpenAI's help](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key) to get an API key.
- Add `OPENAI_API_KEY=<key>` to the env file.

Learn more about the costs of using openai [here](/openai).


### 5. Start the service


Start the service by running:

```
$ docker compose up -d
```
