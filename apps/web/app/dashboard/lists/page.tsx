import AllListsView from "@/components/dashboard/lists/AllListsView";
import { api } from "@/server/api/client";

export default async function ListsPage() {
  const lists = await api.lists.list();

  return (
    <div className="container mt-4 flex flex-col gap-3">
      <p className="text-2xl">📋 All Lists</p>
      <hr />
      <AllListsView initialData={lists.lists} />
    </div>
  );
}
