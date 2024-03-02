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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

  const { data } = api.admin.stats.useQuery(undefined, {
    refetchInterval: 1000,
    placeholderData: keepPreviousData,
  });

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
    <div className="m-4 flex flex-col gap-5 rounded-md border bg-white p-4">
      <p className="text-2xl">Admin</p>
      <hr />
      {data ? (
        <>
          <p className="text-xl">Server Stats</p>
          <Table className="w-1/2">
            <TableBody>
              <TableRow>
                <TableCell className="w-2/3">Num Users</TableCell>
                <TableCell>{data.numUsers}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Num Bookmarks</TableCell>
                <TableCell>{data.numBookmarks}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <hr />
          <p className="text-xl">Background Jobs</p>
          <Table className="w-1/2">
            <TableBody>
              <TableRow>
                <TableCell className="w-2/3">Pending Crawling Jobs</TableCell>
                <TableCell>{data.pendingCrawls}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pending Indexing Jobs</TableCell>
                <TableCell>{data.pendingIndexing}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pending OpenAI Jobs</TableCell>
                <TableCell>{data.pendingOpenai}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      ) : (
        <LoadingSpinner />
      )}
      <hr />
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
    </div>
  );
}
