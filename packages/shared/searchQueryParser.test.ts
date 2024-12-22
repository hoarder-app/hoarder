import { describe, expect, test } from "vitest";

import { parseSearchQuery } from "./searchQueryParser";

describe("Search Query Parser", () => {
  test("simple is queries", () => {
    expect(parseSearchQuery("is:archived")).toEqual({
      type: "archived",
      archived: true,
    });
    expect(parseSearchQuery("is:not_archived")).toEqual({
      type: "archived",
      archived: false,
    });
    expect(parseSearchQuery("is:fav")).toEqual({
      type: "favourited",
      favourited: true,
    });
    expect(parseSearchQuery("is:not_fav")).toEqual({
      type: "favourited",
      favourited: false,
    });
  });

  test("simple string queries", () => {
    expect(parseSearchQuery("url:https://example.com")).toEqual({
      type: "url",
      url: "https://example.com",
    });
    expect(parseSearchQuery('url:"https://example.com"')).toEqual({
      type: "url",
      url: "https://example.com",
    });
    expect(parseSearchQuery("#my-tag")).toEqual({
      type: "tagName",
      tagName: "my-tag",
    });
    expect(parseSearchQuery('#"my tag"')).toEqual({
      type: "tagName",
      tagName: "my tag",
    });
    expect(parseSearchQuery("list:my-list")).toEqual({
      type: "listName",
      listName: "my-list",
    });
    expect(parseSearchQuery('list:"my list"')).toEqual({
      type: "listName",
      listName: "my list",
    });
  });
  test("date queries", () => {
    expect(parseSearchQuery("after:2023-10-12")).toEqual({
      type: "dateAfter",
      dateAfter: new Date("2023-10-12"),
    });
    expect(parseSearchQuery("before:2023-10-12")).toEqual({
      type: "dateBefore",
      dateBefore: new Date("2023-10-12"),
    });
  });

  test("complex queries", () => {
    expect(parseSearchQuery("is:fav is:archived")).toEqual({
      type: "and",
      matchers: [
        {
          type: "favourited",
          favourited: true,
        },
        {
          type: "archived",
          archived: true,
        },
      ],
    });

    expect(parseSearchQuery("(is:fav is:archived) #my-tag")).toEqual({
      type: "and",
      matchers: [
        {
          type: "and",
          matchers: [
            {
              type: "favourited",
              favourited: true,
            },
            {
              type: "archived",
              archived: true,
            },
          ],
        },
        {
          type: "tagName",
          tagName: "my-tag",
        },
      ],
    });

    expect(parseSearchQuery("(is:fav is:archived) or (#my-tag)")).toEqual({
      type: "or",
      matchers: [
        {
          type: "and",
          matchers: [
            {
              type: "favourited",
              favourited: true,
            },
            {
              type: "archived",
              archived: true,
            },
          ],
        },
        {
          type: "tagName",
          tagName: "my-tag",
        },
      ],
    });

    expect(parseSearchQuery("(is:fav or is:archived) and #my-tag")).toEqual({
      type: "and",
      matchers: [
        {
          type: "or",
          matchers: [
            {
              type: "favourited",
              favourited: true,
            },
            {
              type: "archived",
              archived: true,
            },
          ],
        },
        {
          type: "tagName",
          tagName: "my-tag",
        },
      ],
    });
  });
});
