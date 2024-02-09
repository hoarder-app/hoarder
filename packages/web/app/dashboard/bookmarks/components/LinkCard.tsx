"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ImageCard,
  ImageCardBody,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import { useToast } from "@/components/ui/use-toast";
import APIClient from "@/lib/api";
import { ZBookmark } from "@/lib/types/api/bookmarks";
import { MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LinkOptions({ linkId }: { linkId: string }) {
  const { toast } = useToast();
  const router = useRouter();

  const unbookmarkLink = async () => {
    let [_, error] = await APIClient.deleteBookmark(linkId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "There was a problem with your request.",
      });
    } else {
      toast({
        description: "The link has been deleted!",
      });
    }

    router.refresh();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
        <DropdownMenuItem className="text-destructive" onClick={unbookmarkLink}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LinkCard({ bookmark }: { bookmark: ZBookmark }) {
  const link = bookmark.content;
  const parsedUrl = new URL(link.url);

  return (
    <ImageCard
      className={
        "bg-gray-50 duration-300 ease-in border border-grey-100 hover:transition-all hover:border-blue-300"
      }
      image={link?.imageUrl ?? undefined}
    >
      <ImageCardTitle>
        <Link className="line-clamp-3" href={link.url}>
          {link?.title ?? parsedUrl.host}
        </Link>
      </ImageCardTitle>
      <ImageCardBody className="py-2 overflow-clip">
        {bookmark.tags.map((t) => (
          <Badge
            variant="default"
            className="bg-gray-300 text-gray-500"
            key={t.id}
          >
            #{t.name}
          </Badge>
        ))}
      </ImageCardBody>
      <ImageCardFooter>
        <div className="flex justify-between text-gray-500">
          <div className="my-auto">
            <Link className="line-clamp-1 hover:text-black" href={link.url}>
              {parsedUrl.host}
            </Link>
          </div>
          <LinkOptions linkId={bookmark.id} />
        </div>
      </ImageCardFooter>
    </ImageCard>
  );
}
