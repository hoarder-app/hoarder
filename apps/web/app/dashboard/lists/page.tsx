import AllListsView from "@/components/dashboard/lists/AllListsView";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/server";
import { api } from "@/server/api/client";

export default async function ListsPage() {
  const { t } = await useTranslation();
  const lists = await api.lists.list();

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
      <p className="text-2xl">📋 {t("lists.all_lists")}</p>
      <Separator />
      <AllListsView initialData={lists.lists} />
    </div>
  );
}
