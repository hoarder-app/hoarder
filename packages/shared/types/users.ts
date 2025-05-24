import { z } from "zod";

export const PASSWORD_MAX_LENGTH = 100;

export const zSignUpSchema = z
  .object({
    name: z.string().min(1, { message: "Name can't be empty" }),
    email: z.string().email(),
    password: z.string().min(8).max(PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const zChangePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).max(PASSWORD_MAX_LENGTH),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Passwords don't match",
    path: ["newPasswordConfirm"],
  });

export const zWhoAmIResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  email: z.string().nullish(),
});

export const zUserStatsResponseSchema = z.object({
  numBookmarks: z.number(),
  numFavorites: z.number(),
  numArchived: z.number(),
  numTags: z.number(),
  numLists: z.number(),
  numHighlights: z.number(),
});

export const zUserSettingsSchema = z.object({
  bookmarkClickAction: z.enum([
    "open_original_link",
    "expand_bookmark_preview",
  ]),
});

export type ZUserSettings = z.infer<typeof zUserSettingsSchema>;

export const zUpdateUserSettingsSchema = zUserSettingsSchema.partial().pick({
  bookmarkClickAction: true,
});
