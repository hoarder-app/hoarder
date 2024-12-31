import { z } from "zod";

const zTagNameMatcher = z.object({
  type: z.literal("tagName"),
  tagName: z.string(),
  inverse: z.boolean(),
});

const zListNameMatcher = z.object({
  type: z.literal("listName"),
  listName: z.string(),
  inverse: z.boolean(),
});

const zArchivedMatcher = z.object({
  type: z.literal("archived"),
  archived: z.boolean(),
});

const urlMatcher = z.object({
  type: z.literal("url"),
  url: z.string(),
  inverse: z.boolean(),
});

const zFavouritedMatcher = z.object({
  type: z.literal("favourited"),
  favourited: z.boolean(),
});

const zDateAfterMatcher = z.object({
  type: z.literal("dateAfter"),
  dateAfter: z.date(),
  inverse: z.boolean(),
});

const zDateBeforeMatcher = z.object({
  type: z.literal("dateBefore"),
  dateBefore: z.date(),
  inverse: z.boolean(),
});

const zNonRecursiveMatcher = z.union([
  zTagNameMatcher,
  zListNameMatcher,
  zArchivedMatcher,
  urlMatcher,
  zFavouritedMatcher,
  zDateAfterMatcher,
  zDateBeforeMatcher,
]);

type NonRecursiveMatcher = z.infer<typeof zNonRecursiveMatcher>;
export type Matcher =
  | NonRecursiveMatcher
  | { type: "and"; matchers: Matcher[] }
  | { type: "or"; matchers: Matcher[] };

export const zMatcherSchema: z.ZodType<Matcher> = z.lazy(() => {
  return z.discriminatedUnion("type", [
    zTagNameMatcher,
    zListNameMatcher,
    zArchivedMatcher,
    urlMatcher,
    zFavouritedMatcher,
    zDateAfterMatcher,
    zDateBeforeMatcher,
    z.object({
      type: z.literal("and"),
      matchers: z.array(zMatcherSchema),
    }),
    z.object({
      type: z.literal("or"),
      matchers: z.array(zMatcherSchema),
    }),
  ]);
});
