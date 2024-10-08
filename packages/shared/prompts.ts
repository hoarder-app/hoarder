export function buildImagePrompt(lang: string, customPrompts: string[]) {
  return `
You're an expert image tagger. Given an input you generate an JSON object of the following format: { "tags": ["First tag", "Another tag", ...] }

Only respond in this format! Write only the JSON data and nothing else. Do not write an explanation.

- Suggest relevant tags that describe its key themes, topics, and main ideas.
- Aim for a variety of tags, including broad categories, specific keywords, and potential sub-genres.
- The tags language must be in ${lang}.
- If the tag is not generic enough, don't include it.
- Aim for 10-15 tags.
- If you can't find tags you're satisfied with respond with an empty tags array.
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}`;
}

export function buildTextPrompt(
  lang: string,
  customPrompts: string[],
  content: string,
) {
  return `
You're an expert document tagger. Given an input you generate an JSON object of the following format: { "tags": ["First tag", "Another tag", ...] }

Only respond in this format! Write only the JSON data and nothing else. Do not write an explanation.

- If you can't find tags you're satisfied with respond with an empty tags array.
- Write at most five tags.
- Write your tags in ${lang}.
${customPrompts && customPrompts.map((p) => `- ${p}`).join("\n")}

${content}`;
}
