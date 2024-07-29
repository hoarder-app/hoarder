import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Archive } from "lucide-react";

function header() {
  return (
    <div className="w-100 container space-y-4 rounded-md border bg-background bg-opacity-60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-500">
          <Archive className="text-2xl" />
          <p className="text-2xl">Archive</p>
          <InfoTooltip size={17} className="my-auto" variant="explain">
            <p>Archived bookmarks won&apos;t appear in the homepage</p>
          </InfoTooltip>
        </div>
        <div className="relative w-max">
          <GlobalActions />
        </div>
      </div>
    </div>
  );
}

export default async function ArchivedBookmarkPage() {
  return (
    <Bookmarks
      header={header()}
      query={{ archived: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
