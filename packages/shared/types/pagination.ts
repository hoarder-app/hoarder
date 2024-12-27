import { z } from "zod";

export const zCursorV2 = z.object({
  createdAt: z.date(),
  id: z.string(),
});
