"use client";

import { ActionButton } from "@/components/ui/action-button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";

export default function AdminActions() {
  const { t } = useTranslation();
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

  const { mutateAsync: tidyAssets, isPending: isTidyAssetsPending } =
    api.admin.tidyAssets.useMutation({
      onSuccess: () => {
        toast({
          description: "Tidy assets request has been enqueued!",
        });
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: e.message,
        });
      },
    });

  const { mutateAsync: reEmbedBookmarks, isPending: isReEmbedPending } =
    api.admin.reEmbedAllBookmarks.useMutation({
      onSuccess: () => {
        toast({
          description: "ReEmbed request has been enqueued!",
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
      <div className="mb-2 text-xl font-medium">{t("common.actions")}</div>
      <div className="flex flex-col gap-2 sm:w-1/2">
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "failure", runInference: true })
          }
        >
          {t("admin.actions.recrawl_failed_links_only")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "all", runInference: true })
          }
        >
          {t("admin.actions.recrawl_all_links")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isRecrawlPending}
          onClick={() =>
            recrawlLinks({ crawlStatus: "all", runInference: false })
          }
        >
          {t("admin.actions.recrawl_all_links")} (
          {t("admin.actions.without_inference")})
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isInferencePending}
          onClick={() =>
            reRunInferenceOnAllBookmarks({ taggingStatus: "failure" })
          }
        >
          {t("admin.actions.regenerate_ai_tags_for_failed_bookmarks_only")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isInferencePending}
          onClick={() => reRunInferenceOnAllBookmarks({ taggingStatus: "all" })}
        >
          {t("admin.actions.regenerate_ai_tags_for_all_bookmarks")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isReindexPending}
          onClick={() => reindexBookmarks()}
        >
          {t("admin.actions.reindex_all_bookmarks")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isReEmbedPending}
          onClick={() => reEmbedBookmarks()}
        >
          {t("admin.actions.reembed_all_bookmarks")}
        </ActionButton>
        <ActionButton
          variant="destructive"
          loading={isTidyAssetsPending}
          onClick={() => tidyAssets()}
        >
          {t("admin.actions.compact_assets")}
        </ActionButton>
      </div>
    </div>
  );
}
