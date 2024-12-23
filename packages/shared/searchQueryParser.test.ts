import { describe, expect, test } from "vitest";

import { parseSearchQuery } from "./searchQueryParser";

describe("Search Query Parser", () => {
  test("simple is queries", () => {
    expect(parseSearchQuery("is:archived")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "archived",
        archived: true,
      },
    });
    expect(parseSearchQuery("is:not_archived")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "archived",
        archived: false,
      },
    });
    expect(parseSearchQuery("is:fav")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "favourited",
        favourited: true,
      },
    });
    expect(parseSearchQuery("is:not_fav")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "favourited",
        favourited: false,
      },
    });
  });

  test("simple string queries", () => {
    expect(parseSearchQuery("url:https://example.com")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "url",
        url: "https://example.com",
      },
    });
    expect(parseSearchQuery('url:"https://example.com"')).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "url",
        url: "https://example.com",
      },
    });
    expect(parseSearchQuery("#my-tag")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "tagName",
        tagName: "my-tag",
      },
    });
    expect(parseSearchQuery('#"my tag"')).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "tagName",
        tagName: "my tag",
      },
    });
    expect(parseSearchQuery("list:my-list")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "listName",
        listName: "my-list",
      },
    });
    expect(parseSearchQuery('list:"my list"')).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "listName",
        listName: "my list",
      },
    });
  });
  test("date queries", () => {
    expect(parseSearchQuery("after:2023-10-12")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "dateAfter",
        dateAfter: new Date("2023-10-12"),
      },
    });
    expect(parseSearchQuery("before:2023-10-12")).toEqual({
      result: "full",
      text: "",
      matcher: {
        type: "dateBefore",
        dateBefore: new Date("2023-10-12"),
      },
    });
  });

  test("complex queries", () => {
    expect(parseSearchQuery("is:fav is:archived")).toEqual({
      result: "full",
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
      result: "full",
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
      result: "full",
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
      result: "full",
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
    expect(parseSearchQuery("hello")).toEqual({
      result: "full",
      text: "hello",
      matcher: undefined,
    });
    expect(parseSearchQuery("hello world")).toEqual({
      result: "full",
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
      result: "full",
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
      result: "full",
      text: "is:helloworld",
      matcher: {
        type: "favourited",
        favourited: true,
      },
    });
  });

  test("partial results", () => {
    expect(parseSearchQuery("(is:archived) or ")).toEqual({
      result: "partial",
      text: "or",
      matcher: {
        type: "archived",
        archived: true,
      },
    });
    expect(parseSearchQuery("is:fav is: ( random")).toEqual({
      result: "partial",
      text: "is: ( random",
      matcher: {
        type: "favourited",
        favourited: true,
      },
    });
  });
});
