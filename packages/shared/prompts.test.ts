import { describe, expect, test } from "vitest";

import {
  buildContentPromptFromTemplate,
  buildPromptFromTemplate,
} from "./prompts";

describe("Prompts", () => {
  test("Build prompt from template", () => {
    const template = `
Language: {{ lang }}
All tags: {{ tags }}
AI tags: {{ aiTags }}
Human tags: {{ userTags }}
Custom prompts: {{ customPrompts }}
`;
    const lang = "English";
    const tags = {
      all: ["ai1", "ai2", "h1", "h2"],
      ai: ["ai1", "ai2"],
      human: ["h1", "h2"],
    };
    const customPrompts = ["custom prompt: $tags, $aiTags, $userTags"];
    expect(buildPromptFromTemplate(template, lang, tags, customPrompts))
      .toEqual(`
Language: English
All tags: [ai1, ai2, h1, h2]
AI tags: [ai1, ai2]
Human tags: [h1, h2]
Custom prompts: - custom prompt: [ai1, ai2, h1, h2], [ai1, ai2], [h1, h2]
`);
  });

  test("Build content prompt from template", () => {
    const template = `
Language: {{ lang }}
All tags: {{ tags }}
AI tags: {{ aiTags }}
Human tags: {{ userTags }}
Custom prompts: {{ customPrompts }}
Content: {{ content }}
`;
    const lang = "English";
    const tags = {
      all: ["ai1", "ai2", "h1", "h2"],
      ai: ["ai1", "ai2"],
      human: ["h1", "h2"],
    };
    const customPrompts = ["custom prompt: $tags, $aiTags, $userTags"];
    const content = "Bookmark content";
    expect(
      buildContentPromptFromTemplate(
        template,
        lang,
        tags,
        customPrompts,
        content,
        1_000,
      ),
    ).toEqual(`
Language: English
All tags: [ai1, ai2, h1, h2]
AI tags: [ai1, ai2]
Human tags: [h1, h2]
Custom prompts: - custom prompt: [ai1, ai2, h1, h2], [ai1, ai2], [h1, h2]
Content: Bookmark content
`);
  });

  test("Build content prompt: content truncation", () => {
    const template = `Content: {{ content }}`;
    const tags = {
      all: [],
      ai: [],
      human: [],
    };
    const content = "Bookmark content to be truncated";
    expect(
      buildContentPromptFromTemplate(template, "", tags, [], content, 4),
    ).toEqual(`Content: Bookmark content`);
  });
});
