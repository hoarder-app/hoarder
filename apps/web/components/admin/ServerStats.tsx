"use client";

import LoadingSpinner from "@/components/ui/spinner";
import { useClientConfig } from "@/lib/clientConfig";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const REPO_LATEST_RELEASE_API =
  "https://api.github.com/repos/karakeep-app/karakeep/releases/latest";
const REPO_RELEASE_PAGE = "https://github.com/karakeep-app/karakeep/releases";

function useLatestRelease() {
  const { data } = useQuery({
    queryKey: ["latest-release"],
    queryFn: async () => {
      const res = await fetch(REPO_LATEST_RELEASE_API);
      if (!res.ok) {
        return undefined;
      }
      const data = (await res.json()) as { name: string };
      return data.name;
    },
    staleTime: 60 * 60 * 1000,
    enabled: !useClientConfig().disableNewReleaseCheck,
  });
  return data;
}

function ReleaseInfo() {
  const currentRelease = useClientConfig().serverVersion ?? "NA";
  const latestRelease = useLatestRelease();

  let newRelease;
  if (latestRelease && currentRelease != latestRelease) {
    newRelease = (
      <a
        href={REPO_RELEASE_PAGE}
        target="_blank"
        className="text-blue-500"
        rel="noreferrer"
        title="Update available"
      >
        ({latestRelease} ⬆️)
      </a>
    );
  }
  return (
    <div className="text-nowrap">
      <span className="text-3xl font-semibold">{currentRelease}</span>
      <span className="ml-1 text-sm">{newRelease}</span>
    </div>
  );
}

export default function ServerStats() {
  const { t } = useTranslation();
  const { data: serverStats } = api.admin.stats.useQuery(undefined, {
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  if (!serverStats) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 text-xl font-medium">
        {t("admin.server_stats.server_stats")}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">
            {t("admin.server_stats.total_users")}
          </div>
          <div className="text-3xl font-semibold">{serverStats.numUsers}</div>
        </div>
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">
            {t("admin.server_stats.total_bookmarks")}
          </div>
          <div className="text-3xl font-semibold">
            {serverStats.numBookmarks}
          </div>
        </div>
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">
            {t("admin.server_stats.server_version")}
          </div>
          <ReleaseInfo />
        </div>
      </div>
    </div>
  );
}
