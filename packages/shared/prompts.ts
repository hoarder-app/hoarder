// TODO: Use a proper tokenizer
function calculateNumTokens(text: string) {
  return text.split(" ").length;
}

function truncateContent(content: string, length: number) {
  let words = content.split(" ");
  if (words.length > length) {
    words = words.slice(0, length);
    content = words.join(" ");
  }
  return content;
}

export interface PromptTags {
  all: string[];
  ai: string[];
  human: string[];
}

function fillPromptTemplate(
  template: string,
  customPrompts: string[],
  tags: PromptTags,
  lang = "",
  content = "",
) {
  const allTags = `[${tags.all.join(", ")}]`;
  const aiTags = `[${tags.ai.join(", ")}]`;
  const userTags = `[${tags?.human?.join(", ")}]`;
  const customPromptsGroup = customPrompts.map((p) => `- ${p}`).join("\n");

  return template
    .replace(RegExp("{{ customPrompts }}", "g"), customPromptsGroup)
    .replace(RegExp("\\$tags", "g"), "{{ tags }}")
    .replace(RegExp("\\$aiTags", "g"), "{{ aiTags }}")
    .replace(RegExp("\\$userTags", "g"), "{{ userTags }}")
    .replace(RegExp("{{ tags }}", "g"), allTags)
    .replace(RegExp("{{ aiTags }}", "g"), aiTags)
    .replace(RegExp("{{ userTags }}", "g"), userTags)
    .replace(RegExp("{{ lang }}", "g"), lang)
    .replace(RegExp("{{ content }}", "g"), content);
}

export function buildPromptFromTemplate(
  promptTemplate: string,
  lang: string,
  tags: PromptTags,
  customPrompts: string[],
) {
  return fillPromptTemplate(promptTemplate, customPrompts, tags, lang);
}

export function buildContentPromptFromTemplate(
  promptTemplate: string,
  lang: string,
  tags: PromptTags,
  customPrompts: string[],
  content: string,
  contextLength: number,
) {
  const constructPrompt = (c: string) =>
    fillPromptTemplate(promptTemplate, customPrompts, tags, lang, c);

  const promptSize = calculateNumTokens(constructPrompt(""));
  const truncatedContent = truncateContent(content, contextLength - promptSize);
  return constructPrompt(truncatedContent);
}
