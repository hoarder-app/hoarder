import { z } from "zod";

export const ZBookmarkedLink = z.object({
  id: z.string(),
  url: z.string().url(),
  createdAt: z.coerce.date(),

  details: z
    .object({
      title: z.string(),
      description: z.string(),
      imageUrl: z.string().url(),
    })
    .nullish(),
});
export type ZBookmarkedLink = z.infer<typeof ZBookmarkedLink>;

// POST /v1/links
export const ZNewBookmarkedLinkRequest = ZBookmarkedLink.pick({ url: true });

// GET /v1/links
export const ZGetLinksResponse = z.object({
  links: z.array(ZBookmarkedLink),
});
export type ZGetLinksResponse = z.infer<typeof ZGetLinksResponse>;
