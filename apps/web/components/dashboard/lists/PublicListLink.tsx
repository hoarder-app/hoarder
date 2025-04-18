"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import CopyBtn from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useClientConfig } from "@/lib/clientConfig";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { useEditBookmarkList } from "@karakeep/shared-react/hooks/lists";
import { ZBookmarkList } from "@karakeep/shared/types/lists";

export default function PublicListLink({ list }: { list: ZBookmarkList }) {
  const { t } = useTranslation();
  const clientConfig = useClientConfig();

  const { mutate: editList, isPending: isLoading } = useEditBookmarkList();

  const publicListUrl = `${clientConfig.publicUrl}/public/lists/${list.id}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <Badge variant="outline" className="text-xs">
        {t("lists.public_list")}
      </Badge>
      <div className="flex items-center gap-2">
        <Switch
          onCheckedChange={(checked) => {
            editList({
              listId: list.id,
              public: checked,
            });
          }}
          checked={list.public}
          disabled={isLoading || !!clientConfig.demoMode}
        />
      </div>
      {list.public && (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={publicListUrl}
            readOnly
            className="h-8 min-w-0 flex-1 font-mono text-xs"
          />
          <div className="flex flex-shrink-0 gap-1">
            <CopyBtn
              getStringToCopy={() => {
                return publicListUrl;
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 w-8 p-0",
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
