import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import GlobalActions from "@/components/dashboard/GlobalActions";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Archive } from "lucide-react";

function header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2 text-orange-500">
        <Archive className="text-2xl" />
        <p className="text-2xl">Archive</p>
        <InfoTooltip size={17} className="my-auto" variant="explain">
          <p>Archived bookmarks won&apos;t appear in the homepage</p>
        </InfoTooltip>
      </div>
      <div>
        <GlobalActions />
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
