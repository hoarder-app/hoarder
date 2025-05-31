"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import CopyBtn from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { useClientConfig } from "@/lib/clientConfig";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw, Rss, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RssLink({ listId }: { listId: string }) {
  const { t } = useTranslation();
  const clientConfig = useClientConfig();
  const apiUtils = api.useUtils();

  const { mutate: regenRssToken, isPending: isRegenPending } =
    api.lists.regenRssToken.useMutation({
      onSuccess: () => {
        apiUtils.lists.getRssToken.invalidate({ listId });
      },
    });
  const { mutate: clearRssToken, isPending: isClearPending } =
    api.lists.clearRssToken.useMutation({
      onSuccess: () => {
        apiUtils.lists.getRssToken.invalidate({ listId });
      },
    });
  const { data: rssToken, isLoading: isTokenLoading } =
    api.lists.getRssToken.useQuery({ listId });

  const rssUrl = useMemo(() => {
    if (!rssToken || !rssToken.token) {
      return null;
    }
    return `${clientConfig.publicApiUrl}/v1/rss/lists/${listId}?token=${rssToken.token}`;
  }, [rssToken]);

  const isLoading = isRegenPending || isClearPending || isTokenLoading;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <Badge variant="outline" className="text-xs">
        RSS
      </Badge>
      {!rssUrl ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => regenRssToken({ listId })}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="flex items-center">
                <Rss className="mr-2 h-4 w-4 flex-shrink-0 text-orange-500" />
                {t("lists.generate_rss_feed")}
              </span>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={rssUrl}
            readOnly
            className="h-8 min-w-0 flex-1 font-mono text-xs"
          />
          <div className="flex flex-shrink-0 gap-1">
            <CopyBtn
              getStringToCopy={() => {
                return rssUrl;
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 w-8 p-0",
              )}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenRssToken({ listId })}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearRssToken({ listId })}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
