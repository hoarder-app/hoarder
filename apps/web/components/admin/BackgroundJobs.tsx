"use client";

import { ActionButton } from "@/components/ui/action-button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { keepPreviousData } from "@tanstack/react-query";

import LoadingSpinner from "../ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

function AdminActions() {
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

  const { mutate: reprocessAssetsFixMode, isPending: isReprocessingPending } =
    api.admin.reprocessAssetsFixMode.useMutation({
      onSuccess: () => {
        toast({
          description: "Reprocessing enqueued",
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

  return (
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
        onClick={() => recrawlLinks({ crawlStatus: "all", runInference: true })}
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
        loading={isReprocessingPending}
        onClick={() => reprocessAssetsFixMode()}
      >
        {t("admin.actions.reprocess_assets_fix_mode")}
      </ActionButton>
      <ActionButton
        variant="destructive"
        loading={isTidyAssetsPending}
        onClick={() => tidyAssets()}
      >
        {t("admin.actions.compact_assets")}
      </ActionButton>
    </div>
  );
}

export default function BackgroundJobs() {
  const { t } = useTranslation();
  const { data: serverStats } = api.admin.backgroundJobsStats.useQuery(
    undefined,
    {
      refetchInterval: 1000,
      placeholderData: keepPreviousData,
    },
  );

  if (!serverStats) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 text-xl font-medium">
        {t("admin.background_jobs.background_jobs")}
      </div>
      <div className="sm:w-1/2">
        <Table className="rounded-md border">
          <TableHeader className="bg-gray-200">
            <TableHead>{t("admin.background_jobs.job")}</TableHead>
            <TableHead>{t("admin.background_jobs.queued")}</TableHead>
            <TableHead>{t("admin.background_jobs.pending")}</TableHead>
            <TableHead>{t("admin.background_jobs.failed")}</TableHead>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="lg:w-2/3">
                {t("admin.background_jobs.crawler_jobs")}
              </TableCell>
              <TableCell>{serverStats.crawlStats.queued}</TableCell>
              <TableCell>{serverStats.crawlStats.pending}</TableCell>
              <TableCell>{serverStats.crawlStats.failed}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("admin.background_jobs.indexing_jobs")}</TableCell>
              <TableCell>{serverStats.indexingStats.queued}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("admin.background_jobs.inference_jobs")}</TableCell>
              <TableCell>{serverStats.inferenceStats.queued}</TableCell>
              <TableCell>{serverStats.inferenceStats.pending}</TableCell>
              <TableCell>{serverStats.inferenceStats.failed}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t("admin.background_jobs.tidy_assets_jobs")}
              </TableCell>
              <TableCell>{serverStats.tidyAssetsStats.queued}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("admin.background_jobs.video_jobs")}</TableCell>
              <TableCell>{serverStats.videoStats.queued}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("admin.background_jobs.webhook_jobs")}</TableCell>
              <TableCell>{serverStats.webhookStats.queued}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t("admin.background_jobs.asset_preprocessing_jobs")}
              </TableCell>
              <TableCell>
                {serverStats.assetPreprocessingStats.queued}
              </TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("admin.background_jobs.feed_jobs")}</TableCell>
              <TableCell>{serverStats.feedStats.queued}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <AdminActions />
    </div>
  );
}
