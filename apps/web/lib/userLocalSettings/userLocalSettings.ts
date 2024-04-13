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
  cookies().set(
    USER_LOCAL_SETTINGS_COOKIE_NAME,
    JSON.stringify({ ...parsed, bookmarkGridLayout: layout }),
  );
}
