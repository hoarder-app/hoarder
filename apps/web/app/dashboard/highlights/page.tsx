import AllHighlights from "@/components/dashboard/highlights/AllHighlights";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/server";
import { api } from "@/server/api/client";
import { Highlighter } from "lucide-react";

export default async function HighlightsPage() {
  const { t } = await useTranslation();
  const highlights = await api.highlights.getAll({});
  return (
    <div className="flex flex-col gap-8 rounded-md border bg-background p-4">
      <span className="flex items-center gap-1 text-2xl">
        <Highlighter className="size-6" />
        {t("common.highlights")}
      </span>
      <Separator />
      <AllHighlights highlights={highlights} />
    </div>
  );
}
