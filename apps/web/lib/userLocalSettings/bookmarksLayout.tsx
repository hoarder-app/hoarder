"use client";

import type { z } from "zod";
import { createContext, useContext } from "react";

import type { BookmarksLayoutTypes, zUserLocalSettings } from "./types";

const defaultLayout: BookmarksLayoutTypes = "masonry";

export const UserLocalSettingsCtx = createContext<
  z.infer<typeof zUserLocalSettings>
>({
  bookmarkGridLayout: defaultLayout,
});

function useUserLocalSettings() {
  return useContext(UserLocalSettingsCtx);
}

export function useBookmarkLayout() {
  const settings = useUserLocalSettings();
  return settings.bookmarkGridLayout;
}

export function bookmarkLayoutSwitch<T>(
  layout: BookmarksLayoutTypes,
  data: Record<BookmarksLayoutTypes, T>,
) {
  return data[layout];
}

export function useBookmarkLayoutSwitch<T>(
  data: Record<BookmarksLayoutTypes, T>,
) {
  const layout = useBookmarkLayout();
  return data[layout];
}
