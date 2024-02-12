import { useEffect, useState } from "react";
import { Settings } from "./settings";

export default function SavePage({ settings }: { settings: Settings }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  async function runFetch() {
    const resp = await fetch(
      `${settings.address}/api/trpc/bookmarks.bookmarkLink`,
      {
        method: "POST",
      },
    );

    if (!resp.ok) {
      setError("Something went wrong: " + (await resp.json()));
    }
    setLoading(false);
  }

  useEffect(() => {
    runFetch();
  }, []);

  if (loading) {
    return <div>Loading ...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error} ...</div>;
  }

  return (
    <div>
      SAVED!
      <button onClick={runFetch}> Reload </button>
    </div>
  );
}
