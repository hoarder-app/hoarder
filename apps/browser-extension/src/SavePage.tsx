import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { BookmarkTypes } from "../../../packages/shared/types/bookmarks";
import Spinner from "./Spinner";
import { api } from "./utils/trpc";

export default function SavePage() {
  const [error, setError] = useState<string | undefined>(undefined);

  const {
    data,
    mutate: createBookmark,
    status,
  } = api.bookmarks.createBookmark.useMutation({
    onError: (e) => {
      setError("Something went wrong: " + e.message);
    },
  });

  useEffect(() => {
    async function getUrlFromStorage(): Promise<string> {
      const { url } = await chrome.storage.session.get("url");
      // Delete the URL immediately to avoid issues with lingering values
      await chrome.storage.session.set({ url: void 0 });
      return url as string;
    }

    async function runSave() {
      let currentUrl = await getUrlFromStorage();
      if (!currentUrl) {
        const [currentTab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (currentTab?.url) {
          currentUrl = currentTab.url;
        } else {
          setError("Couldn't find the URL of the current tab");
          return;
        }
      }

      createBookmark({
        type: BookmarkTypes.LINK,
        url: currentUrl,
      });
    }
    runSave();
  }, [createBookmark]);

  switch (status) {
    case "error": {
      return <div className="text-red-500">{error}</div>;
    }
    case "success": {
      return <Navigate to={`/bookmark/${data.id}`} />;
    }
    case "pending": {
      return (
        <div className="flex justify-between text-lg">
          <span>Saving Bookmark </span>
          <Spinner />
        </div>
      );
    }
    case "idle": {
      return <div />;
    }
  }
}
