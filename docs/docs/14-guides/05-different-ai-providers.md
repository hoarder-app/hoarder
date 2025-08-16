# Configuring different AI Providers

Karakeep uses LLM providers for AI tagging and summarization. We support OpenAI-compatible providers and ollama. This guide will show you how to configure different providers.

## OpenAI

If you want to use OpenAI itself, you just need to pass in the OPENAI_API_KEY environment variable.

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# You can change the default models by uncommenting the following lines, and choosing your model.
# INFERENCE_TEXT_MODEL=gpt-4.1-mini
# INFERENCE_IMAGE_MODEL=gpt-4o-mini
```

## Ollama

Ollama is a local LLM provider that you can use to run your own LLM server. You'll need to pass ollama's address to karakeep and you need to ensure that it's accessible from within the karakeep container (e.g. no localhost addresses).

```
# MAKE SURE YOU DON'T HAVE OPENAI_API_KEY set, otherwise it takes precedence.

OLLAMA_BASE_URL=http://ollama.mylab.com:11434

# Make sure to pull the models in ollama first. Example models:
INFERENCE_TEXT_MODEL=gemma3
INFERENCE_IMAGE_MODEL=llava

# If the model you're using doesn't support structured output, you also need:
# INFERENCE_OUTPUT_SCHEMA=plain
```

## Gemini

Gemini has an OpenAI-compatible API. You need to get an api key from Google AI Studio.

```

OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
OPENAI_API_KEY=YOUR_API_KEY

# Example models:
INFERENCE_TEXT_MODEL=gemini-2.0-flash
INFERENCE_IMAGE_MODEL=gemini-2.0-flash
```

## OpenRouter

```
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=YOUR_API_KEY

# Example models:
INFERENCE_TEXT_MODEL=meta-llama/llama-4-scout
INFERENCE_IMAGE_MODEL=meta-llama/llama-4-scout
```

## Perplexity

```
OPENAI_BASE_URL: https://api.perplexity.ai
OPENAI_API_KEY: Your Perplexity API Key
INFERENCE_TEXT_MODEL: sonar-pro
INFERENCE_IMAGE_MODEL: sonar-pro
```
