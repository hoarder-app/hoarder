import { BackButton } from "@/components/ui/back-button";
import { api } from "@/server/api/client";
import { ArrowLeftCircle, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

export default async function BookmarkPreviewPage({
  params,
}: {
  params: { bookmarkId: string };
}) {
  const bookmark = await api.bookmarks.getBookmark({
    bookmarkId: params.bookmarkId,
  });

  const linkHeader = bookmark.content.type == "link" && (
    <div className="flex flex-col space-y-2">
      <p className="text-center text-3xl">{bookmark.content.title}</p>
      <Link href={bookmark.content.url} className="mx-auto flex gap-2">
        <span className="my-auto">View Original</span>
        <ExternalLink />
      </Link>
    </div>
  );

  let content;
  switch (bookmark.content.type) {
    case "link": {
      content = (
        <div
          dangerouslySetInnerHTML={{
            __html: bookmark.content.htmlContent || "",
          }}
          className="prose"
        />
      );
      break;
    }
    case "text": {
      content = <Markdown className="prose">{bookmark.content.text}</Markdown>;
      break;
    }
  }

  return (
    <div className="bg-background m-4 min-h-screen space-y-4 rounded-md border p-4">
      <div className="flex justify-between">
        <BackButton className="ghost" variant="ghost">
          <ArrowLeftCircle />
        </BackButton>
        <div className="my-auto">
          <span className="my-auto flex gap-2">
            <CalendarDays /> {bookmark.createdAt.toLocaleString()}
          </span>
        </div>
      </div>
      <hr />
      {linkHeader}
      <div className="mx-auto flex h-full border-x p-2 px-4 lg:w-2/3">
        {content}
      </div>
    </div>
  );
}
