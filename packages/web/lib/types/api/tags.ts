import { z } from "zod";

export const zBookmarkTagSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ZBookmarkTags = z.infer<typeof zBookmarkTagSchema>;
