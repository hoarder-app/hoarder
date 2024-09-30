"use client";

import { ActionButton } from "@/components/ui/action-button";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";

export default function AdminActions() {
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

  const {
    mutate: reRunInferenceOnAllBookmarks,
    isPending: isInferencePending,
  } = api.admin.reRunInferenceOnAllBookmarks.useMutation({
    onSuccess: () => {
      toast({
        description: "Inference jobs enqueued",
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
    <div>
      <div className="mb-2 mt-8 text-xl font-medium">Actions</div>
      <div className="flex flex-col gap-2 sm:w-1/2">
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "failure", runInference: true })
          }
        >
          Recrawl Failed Links Only
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "all", runInference: true })
          }
        >
          Recrawl All Links
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "all", runInference: false })
          }
        >
          Recrawl All Links (Without Inference)
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isInferencePending}
          onClick={() => reRunInferenceOnAllBookmarks()}
        >
          Regenerate AI Tags for All Bookmarks
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isReindexPending}
          onClick={() => reindexBookmarks()}
        >
          Reindex All Bookmarks
        </ActionButton>
      </div>
    </div>
  );
}
