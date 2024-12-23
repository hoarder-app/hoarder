import { describe, expect, test } from "vitest";

import { parseSearchQuery } from "./searchQueryParser";

describe("Search Query Parser", () => {
  test("simple is queries", () => {
    expect(parseSearchQuery("is:archived")).toEqual({
      text: "",
      matcher: {
        type: "archived",
        archived: true,
      },
    });
    expect(parseSearchQuery("is:not_archived")).toEqual({
      text: "",
      matcher: {
        type: "archived",
        archived: false,
      },
    });
    expect(parseSearchQuery("is:fav")).toEqual({
      text: "",
      matcher: {
        type: "favourited",
        favourited: true,
      },
    });
    expect(parseSearchQuery("is:not_fav")).toEqual({
      text: "",
      matcher: {
        type: "favourited",
        favourited: false,
      },
    });
  });

  test("simple string queries", () => {
    expect(parseSearchQuery("url:https://example.com")).toEqual({
      text: "",
      matcher: {
        type: "url",
        url: "https://example.com",
      },
    });
    expect(parseSearchQuery('url:"https://example.com"')).toEqual({
      text: "",
      matcher: {
        type: "url",
        url: "https://example.com",
      },
    });
    expect(parseSearchQuery("#my-tag")).toEqual({
      text: "",
      matcher: {
        type: "tagName",
        tagName: "my-tag",
      },
    });
    expect(parseSearchQuery('#"my tag"')).toEqual({
      text: "",
      matcher: {
        type: "tagName",
        tagName: "my tag",
      },
    });
    expect(parseSearchQuery("list:my-list")).toEqual({
      text: "",
      matcher: {
        type: "listName",
        listName: "my-list",
      },
    });
    expect(parseSearchQuery('list:"my list"')).toEqual({
      text: "",
      matcher: {
        type: "listName",
        listName: "my list",
      },
    });
  });
  test("date queries", () => {
    expect(parseSearchQuery("after:2023-10-12")).toEqual({
      text: "",
      matcher: {
        type: "dateAfter",
        dateAfter: new Date("2023-10-12"),
      },
    });
    expect(parseSearchQuery("before:2023-10-12")).toEqual({
      text: "",
      matcher: {
        type: "dateBefore",
        dateBefore: new Date("2023-10-12"),
      },
    });
  });

  test("complex queries", () => {
    expect(parseSearchQuery("is:fav is:archived")).toEqual({
      text: "",
      matcher: {
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
    });

    expect(parseSearchQuery("(is:fav is:archived) #my-tag")).toEqual({
      text: "",
      matcher: {
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
          {
            type: "tagName",
            tagName: "my-tag",
          },
        ],
      },
    });

    expect(parseSearchQuery("(is:fav is:archived) or (#my-tag)")).toEqual({
      text: "",
      matcher: {
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
      },
    });

    expect(parseSearchQuery("(is:fav or is:archived) and #my-tag")).toEqual({
      text: "",
      matcher: {
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
      },
    });
  });
  test("pure text", () => {
    expect(parseSearchQuery("hello world")).toEqual({
      text: "hello world",
      matcher: undefined,
    });
  });

  test("text interlived with matchers", () => {
    expect(
      parseSearchQuery(
        "hello is:fav world is:archived mixed world #my-tag test",
      ),
    ).toEqual({
      text: "hello world mixed world test",
      matcher: {
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
          {
            type: "tagName",
            tagName: "my-tag",
          },
        ],
      },
    });
  });

  test("unknown qualifiers are emitted as pure text", () => {
    expect(parseSearchQuery("is:fav is:helloworld")).toEqual({
      text: "is:helloworld",
      matcher: {
        type: "favourited",
        favourited: true,
      },
    });
  });
});
