import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import ChangeLayout from "@/components/dashboard/ChangeLayout";
import InfoTooltip from "@/components/ui/info-tooltip";

function header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <p className="text-2xl">🗄️ Archive</p>
        <InfoTooltip size={17} className="my-auto" variant="explain">
          <p>Archived bookmarks won&apos;t appear in the homepage</p>
        </InfoTooltip>
      </div>
      <div>
        <ChangeLayout />
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
