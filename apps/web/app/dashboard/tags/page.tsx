import AllTagsView from "@/components/dashboard/tags/AllTagsView";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { Tag } from "lucide-react";

export default async function TagsPage() {
  const allTags = (await api.tags.list()).tags;

  return (
    <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
      <div className="flex items-center gap-2 text-orange-500">
        <Tag size={32} />
        <p className="text-2xl">All Tags</p>
      </div>
      <Separator />
      <div className="pt-10">
        <AllTagsView initialData={allTags} />
      </div>
    </div>
  );
}
