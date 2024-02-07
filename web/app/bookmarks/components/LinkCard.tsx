import { ZBookmarkedLink } from "@/lib/types/api/links";
import Link from "next/link";

export default async function LinkCard({ link }: { link: ZBookmarkedLink }) {
  return (
    <Link href={link.url} className="border rounded-md hover:border-blue-300">
      <div className="p-4">
        <h2 className="text-lg font-semibold">
          {link.details?.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" width="10" height="10" src={link.details?.favicon} />
          )}
          {link.details?.title ?? link.id}
        </h2>
        <p className="text-gray-600">{link.details?.description ?? link.url}</p>
      </div>
    </Link>
  );
}
