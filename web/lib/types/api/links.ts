import { z } from "zod";

export const zBookmarkedLinkSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  createdAt: z.coerce.date(),

  details: z
    .object({
      title: z.string().nullish(),
      description: z.string().nullish(),
      imageUrl: z.string().url().nullish(),
      favicon: z.string().url().nullish(),
    })
    .nullish(),
});
export type ZBookmarkedLink = z.infer<typeof zBookmarkedLinkSchema>;

// POST /v1/links
export const zNewBookmarkedLinkRequestSchema = zBookmarkedLinkSchema.pick({
  url: true,
});
export type ZNewBookmarkedLinkRequest = z.infer<
  typeof zNewBookmarkedLinkRequestSchema
>;

// GET /v1/links
export const zGetLinksResponseSchema = z.object({
  links: z.array(zBookmarkedLinkSchema),
});
export type ZGetLinksResponse = z.infer<typeof zGetLinksResponseSchema>;
