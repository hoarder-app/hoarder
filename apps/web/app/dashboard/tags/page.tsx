import AllTagsView from "@/components/dashboard/tags/AllTagsView";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/server";
import { api } from "@/server/api/client";

export default async function TagsPage() {
  const { t } = await useTranslation();
  const allTags = (await api.tags.list()).tags;

  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <span className="text-2xl">{t("tags.all_tags")}</span>
      <Separator />
      <AllTagsView initialData={allTags} />
    </div>
  );
}
