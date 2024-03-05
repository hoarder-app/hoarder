import { useNavigate, useParams } from "react-router-dom";
import { api } from "./utils/trpc";
import usePluginSettings from "./utils/settings";
import { ArrowUpRightFromSquare, Trash } from "lucide-react";
import Spinner from "./Spinner";

export default function BookmarkSavedPage() {
  const { bookmarkId } = useParams();
  const navigate = useNavigate();

  const { mutate: deleteBookmark, isPending } =
    api.bookmarks.deleteBookmark.useMutation({
      onSuccess: () => {
        navigate("/bookmarkdeleted");
      },
      onError: () => {},
    });

  const [settings] = usePluginSettings();

  if (!bookmarkId) {
    return <div>NOT FOUND</div>;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-lg">Bookmarked!</p>
      <div className="flex gap-2">
        <a
          className="flex gap-2 rounded-md p-3 text-black hover:text-black"
          target="_blank"
          href={`${settings.address}/dashboard/preview/${bookmarkId}`}
        >
          <ArrowUpRightFromSquare className="my-auto" size="20" />
          <p className="my-auto">Open</p>
        </a>
        <a
          onClick={() => deleteBookmark({ bookmarkId: bookmarkId })}
          className="flex gap-2 text-red-500 hover:text-red-500"
          href="#"
        >
          {!isPending ? (
            <>
              <Trash className="my-auto" size="20" />
              <p className="my-auto">Delete</p>
            </>
          ) : (
            <span className="m-auto">
              <Spinner />
            </span>
          )}
        </a>
      </div>
    </div>
  );
}
