"use server";

import { cookies } from "next/headers";

import type { BookmarksLayoutTypes } from "./types";
import {
  parseUserLocalSettings,
  USER_LOCAL_SETTINGS_COOKIE_NAME,
} from "./types";

export async function updateBookmarksLayout(layout: BookmarksLayoutTypes) {
  const userSettings = cookies().get(USER_LOCAL_SETTINGS_COOKIE_NAME);
  const parsed = parseUserLocalSettings(userSettings?.value);
  cookies().set({
    name: USER_LOCAL_SETTINGS_COOKIE_NAME,
    value: JSON.stringify({ ...parsed, bookmarkGridLayout: layout }),
    maxAge: 34560000, // Chrome caps max age to 400 days
    sameSite: "lax",
  });
}
