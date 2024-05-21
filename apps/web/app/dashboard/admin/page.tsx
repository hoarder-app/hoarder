"use client";

import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { dynamicConfigSchemaType } from "@hoarder/shared/types/admin";

import { AiConfigurationTab } from "./ai-configuration-tab";
import { CrawlerConfigurationTab } from "./crawler-configuration-tab";
import { GeneralTab } from "./general-settings-tab";

const REPO_LATEST_RELEASE_API =
  "https://api.github.com/repos/mohamedbassem/hoarder-app/releases/latest";
const REPO_RELEASE_PAGE =
  "https://github.com/MohamedBassem/hoarder-app/releases";

export function useDynamicServerConfiguration():
  | dynamicConfigSchemaType
  | undefined {
  const { data } = api.admin.config.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  return data;
}

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
  const currentRelease = useClientConfig().serverVersion ?? "not set";
  const latestRelease = useLatestRelease();

  let newRelease;
  if (latestRelease && currentRelease != latestRelease) {
    newRelease = (
      <a
        href={REPO_RELEASE_PAGE}
        target="_blank"
        className="text-blue-500"
        rel="noreferrer"
      >
        (New release available: {latestRelease})
      </a>
    );
  }
  return (
    <p className="text-nowrap">
      {currentRelease} {newRelease}
    </p>
  );
}

function ServerStatsTab() {
  const { data: serverStats } = api.admin.stats.useQuery(undefined, {
    refetchInterval: 1000,
    placeholderData: keepPreviousData,
  });

  if (!serverStats) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <p className="text-xl">Server Stats</p>
      <Table className="lg:w-1/2">
        <TableBody>
          <TableRow>
            <TableCell className="lg:w-2/3">Num Users</TableCell>
            <TableCell>{serverStats.numUsers}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Num Bookmarks</TableCell>
            <TableCell>{serverStats.numBookmarks}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="lg:w-2/3">Server Version</TableCell>
            <TableCell>
              <ReleaseInfo />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Separator />
      <p className="text-xl">Background Jobs</p>
      <Table className="lg:w-1/2">
        <TableHeader>
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
    </>
  );
}

export default function AdminPage() {
  const dynamicServerConfiguration = useDynamicServerConfiguration();
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status == "loading" || !dynamicServerConfiguration) {
    return <LoadingSpinner />;
  }

  if (!session || session.user.role != "admin") {
    router.push("/");
    return;
  }

  return (
    <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
      <p className="text-2xl">Admin</p>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 p-5">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="serverstats">Server Statistics</TabsTrigger>
          <TabsTrigger value="ai-configuration">AI Configuration</TabsTrigger>
          <TabsTrigger value="crawler-configuration">
            Crawler Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
            <GeneralTab {...dynamicServerConfiguration.generalSettings} />
          </div>
        </TabsContent>
        <TabsContent value="serverstats">
          <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
            <ServerStatsTab />
          </div>
        </TabsContent>
        <TabsContent value="ai-configuration">
          <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
            <AiConfigurationTab {...dynamicServerConfiguration.aiConfig} />
          </div>
        </TabsContent>
        <TabsContent value="crawler-configuration">
          <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
            <CrawlerConfigurationTab
              {...dynamicServerConfiguration.crawlerConfig}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
