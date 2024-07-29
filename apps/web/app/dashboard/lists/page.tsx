import AllListsView from "@/components/dashboard/lists/AllListsView";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";
import { Clipboard } from "lucide-react";

export default async function ListsPage() {
  const lists = await api.lists.list();

  return (
    <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
      <div className="flex items-center gap-2 text-orange-500">
        <Clipboard className="text-2xl" />
        <p className="text-2xl">All Lists</p>
      </div>
      <Separator />
      <AllListsView initialData={lists.lists} />
    </div>
  );
}
