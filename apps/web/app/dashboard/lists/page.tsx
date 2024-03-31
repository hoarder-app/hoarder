import AllListsView from "@/components/dashboard/lists/AllListsView";
import { Separator } from "@/components/ui/separator";
import { api } from "@/server/api/client";

export default async function ListsPage() {
  const lists = await api.lists.list();

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-background p-4">
      <p className="text-2xl">📋 All Lists</p>
      <Separator />
      <AllListsView initialData={lists.lists} />
    </div>
  );
}
