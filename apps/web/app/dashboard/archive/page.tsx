import Bookmarks from "@/components/dashboard/bookmarks/Bookmarks";
import InfoTooltip from "@/components/ui/info-tooltip";

export default async function ArchivedBookmarkPage() {
  return (
    <Bookmarks
      header={
        <span className="flex gap-2">
          <p className="text-2xl">🗄️ Archive</p>
          <InfoTooltip size={17} className="my-auto" variant="explain">
            <p>Archived bookmarks won&apos;t appear in the homepage</p>
          </InfoTooltip>
        </span>
      }
      query={{ archived: true }}
      showDivider={true}
      showEditorCard={true}
    />
  );
}
