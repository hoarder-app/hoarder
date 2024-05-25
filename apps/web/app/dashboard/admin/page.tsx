"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
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
import { toast } from "@/components/ui/use-toast";
import { useClientConfig } from "@/lib/clientConfig";
import { api } from "@/lib/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useSession } from "next-auth/react";

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

function ActionsSection() {
  const { mutate: recrawlLinks, isPending: isRecrawlPending } =
    api.admin.recrawlLinks.useMutation({
      onSuccess: () => {
        toast({
          description: "Recrawl enqueued",
        });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: e.message,
        });
      },
    });

  const { mutate: reindexBookmarks, isPending: isReindexPending } =
    api.admin.reindexAllBookmarks.useMutation({
      onSuccess: () => {
        toast({
          description: "Reindex enqueued",
        });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: e.message,
        });
      },
    });

  return (
    <>
      <p className="text-xl">Actions</p>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() =>
          recrawlLinks({ crawlStatus: "failure", runInference: true })
        }
      >
        Recrawl Failed Links Only
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() => recrawlLinks({ crawlStatus: "all", runInference: true })}
      >
        Recrawl All Links
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() =>
          recrawlLinks({ crawlStatus: "all", runInference: false })
        }
      >
        Recrawl All Links (Without Inference)
      </ActionButton>
      <ActionButton
        className="lg:w-1/2"
        variant="destructive"
        loading={isReindexPending}
        onClick={() => reindexBookmarks()}
      >
        Reindex All Bookmarks
      </ActionButton>
    </>
  );
}

function ServerStatsSection() {
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

function UsersSection() {
  const { data: session } = useSession();
  const invalidateUserList = api.useUtils().users.list.invalidate;
  const { data: users } = api.users.list.useQuery();
  const { mutate: deleteUser, isPending: isDeletionPending } =
    api.users.delete.useMutation({
      onSuccess: () => {
        toast({
          description: "User deleted",
        });
        invalidateUserList();
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Something went wrong: ${e.message}`,
        });
      },
    });

  if (!users) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <p className="text-xl">Users</p>
      <Table>
        <TableHeader>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Action</TableHead>
        </TableHeader>
        <TableBody>
          {users.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <ActionButton
                  variant="destructive"
                  onClick={() => deleteUser({ userId: u.id })}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id}
                >
                  <Trash />
                </ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status == "loading") {
    return <LoadingSpinner />;
  }

  if (!session || session.user.role != "admin") {
    router.push("/");
    return;
  }

  return (
    <div className="flex flex-col gap-5 rounded-md border bg-background p-4">
      <p className="text-2xl">Admin</p>
      <Separator />
      <ServerStatsSection />
      <Separator />
      <UsersSection />
      <Separator />
      <ActionsSection />
    </div>
  );
}
