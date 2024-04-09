# OpenAI Costs

This service uses OpenAI for automatic tagging. This means that you'll incur some costs if automatic tagging is enabled. There are two type of inferences that we do:

## Text Tagging

For text tagging, we use the `gpt-3.5-turbo-0125` model. This model is [extremely cheap](https://openai.com/pricing). Cost per inference varies depending on the content size per article. Though, roughly, You'll be able to generate tags for almost 1000+ bookmarks for less than $1.

## Image Tagging

For image uploads, we use the `gpt-4-turbo` model for extracting tags from the image. You can learn more about the costs of using this model [here](https://platform.openai.com/docs/guides/vision/calculating-costs). To lower the costs, we're using the low resolution mode (fixed number of tokens regardless of image size). The gpt-4 model, however, is much more expensive than the `gpt-3.5-turbo`. Currently, we're using around 350 token per image inference which ends up costing around $0.01 per inference. So around 10x more expensive than the text tagging.
