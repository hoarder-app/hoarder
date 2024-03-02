"use client";

import { ActionButton } from "@/components/ui/action-button";
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
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function ActionsSection() {
  const { mutate: recrawlLinks, isPending: isRecrawlPending } =
    api.admin.recrawlAllLinks.useMutation({
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
        className="w-1/2"
        variant="destructive"
        loading={isRecrawlPending}
        onClick={() => recrawlLinks()}
      >
        Recrawl All Links
      </ActionButton>
      <ActionButton
        className="w-1/2"
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
      <Table className="w-1/2">
        <TableBody>
          <TableRow>
            <TableCell className="w-2/3">Num Users</TableCell>
            <TableCell>{serverStats.numUsers}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Num Bookmarks</TableCell>
            <TableCell>{serverStats.numBookmarks}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <hr />
      <p className="text-xl">Background Jobs</p>
      <Table className="w-1/2">
        <TableBody>
          <TableRow>
            <TableCell className="w-2/3">Pending Crawling Jobs</TableCell>
            <TableCell>{serverStats.pendingCrawls}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pending Indexing Jobs</TableCell>
            <TableCell>{serverStats.pendingIndexing}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Pending OpenAI Jobs</TableCell>
            <TableCell>{serverStats.pendingOpenai}</TableCell>
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
    <div className="m-4 flex flex-col gap-5 rounded-md border bg-white p-4">
      <p className="text-2xl">Admin</p>
      <hr />
      <ServerStatsSection />
      <hr />
      <UsersSection />
      <hr />
      <ActionsSection />
    </div>
  );
}
