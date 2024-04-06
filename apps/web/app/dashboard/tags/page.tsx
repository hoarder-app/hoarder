import AllTagsView from "@/components/dashboard/tags/AllTagsView";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";

export default async function TagsPage() {
  const allTags = (await api.tags.list()).tags;

  return (
    <div className="space-y-4 rounded-md border bg-background p-4">
      <span className="text-2xl">All Tags</span>
      <Separator />
      <AllTagsView initialData={allTags} />
    </div>
  );
}
