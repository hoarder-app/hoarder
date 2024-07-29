import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import { Star } from "lucide-react";

export default async function FavouritesBookmarkPage() {
  return (
    <Bookmarks
      header={
        <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500">
              <Star className="text-2xl" />
              <p className="text-2xl">Favourites</p>
            </div>
            <div className="relative w-max">
              <GlobalActions />
            </div>
          </div>
        </div>
      }
      query={{ favourited: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
