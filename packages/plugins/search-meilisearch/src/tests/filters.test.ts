import { describe, expect, test } from "vitest";

import type { FilterQuery } from "@karakeep/shared/search";

import { filterToMeiliSearchFilter } from "../index";

describe("search filter translation", () => {
  test("groups access filters so qualifiers stay ANDed with them", () => {
    const accessFilter: FilterQuery = {
      type: "or",
      filters: [
        { type: "eq", field: "userId", value: "user-1" },
        { type: "in", field: "id", values: ["shared-1", "shared-2"] },
      ],
    };

    expect(filterToMeiliSearchFilter(accessFilter)).toBe(
      '(userId = "user-1" OR id IN [shared-1,shared-2])',
    );
  });
});
