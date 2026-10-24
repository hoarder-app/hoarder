import { describe, expect, test } from "vitest";

import { toMeiliSearchOptions } from "../index";

describe("search filter translation", () => {
  test("forwards the public-field allowlist for shared searches", () => {
    expect(
      toMeiliSearchOptions({
        query: "secret",
        attributesToSearchOn: ["title", "content"],
      }).attributesToSearchOn,
    ).toEqual(["title", "content"]);
  });
});
