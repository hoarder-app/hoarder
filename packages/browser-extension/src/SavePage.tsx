import { useEffect, useState } from "react";
import { Settings } from "./settings";
import Spinner from "./Spinner";

export default function SavePage({ settings }: { settings: Settings }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function runFetch() {
      let currentUrl;
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (currentTab?.url) {
        currentUrl = currentTab.url;
      } else {
        setError("Couldn't find the URL of the current tab");
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch(
          `${settings.address}/api/trpc/bookmarks.createBookmark`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${settings.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              json: {
                type: "link",
                url: currentUrl,
              },
            }),
          },
        );
        if (!resp.ok) {
          setError(
            "Something went wrong: " + JSON.stringify(await resp.json()),
          );
        }
      } catch (e) {
        setError("Message: " + (e as Error).message);
      }

      setLoading(false);
    }
    runFetch();
  }, [settings]);

  if (loading) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error} ...</div>;
  }

  return <div className="m-auto text-lg">Bookmark Saved</div>;
}
