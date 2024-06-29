"use client";

import LoadingSpinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClientConfig } from "@/lib/clientConfig";
import { api } from "@/lib/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const REPO_LATEST_RELEASE_API =
  "https://api.github.com/repos/hoarder-app/hoarder/releases/latest";
const REPO_RELEASE_PAGE = "https://github.com/hoarder-app/hoarder/releases";

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
  const { data: serverStats } = api.admin.stats.useQuery(undefined, {
    refetchInterval: 1000,
    placeholderData: keepPreviousData,
  });

  if (!serverStats) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="mb-2 text-xl font-medium">Server Stats</div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">Total Users</div>
          <div className="text-3xl font-semibold">{serverStats.numUsers}</div>
        </div>
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">
            Total Bookmarks
          </div>
          <div className="text-3xl font-semibold">
            {serverStats.numBookmarks}
          </div>
        </div>
        <div className="rounded-md border bg-background p-4 sm:w-1/4">
          <div className="text-sm font-medium text-gray-400">
            Server Version
          </div>
          <ReleaseInfo />
        </div>
      </div>

      <div className="sm:w-1/2">
        <div className="mb-2 mt-8 text-xl font-medium">Background Jobs</div>
        <Table className="rounded-md border">
          <TableHeader className="bg-gray-200">
            <TableHead>Job</TableHead>
            <TableHead>Queued</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Failed</TableHead>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="lg:w-2/3">Crawling Jobs</TableCell>
              <TableCell>{serverStats.crawlStats.queuedInRedis}</TableCell>
              <TableCell>{serverStats.crawlStats.pending}</TableCell>
              <TableCell>{serverStats.crawlStats.failed}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Indexing Jobs</TableCell>
              <TableCell>{serverStats.indexingStats.queuedInRedis}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Inference Jobs</TableCell>
              <TableCell>{serverStats.inferenceStats.queuedInRedis}</TableCell>
              <TableCell>{serverStats.inferenceStats.pending}</TableCell>
              <TableCell>{serverStats.inferenceStats.failed}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
