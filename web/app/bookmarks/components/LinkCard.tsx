"use client";

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
import { ZBookmarkedLink } from "@/lib/types/api/links";
import { MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";

export function LinkOptions() {
  // TODO: Implement deletion
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-fit">
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LinkCard({ link }: { link: ZBookmarkedLink }) {
  const parsedUrl = new URL(link.url);

  return (
    <ImageCard
      className={
        "bg-gray-50 duration-300 ease-in border border-grey-100 hover:transition-all hover:border-blue-300"
      }
      image={link.details?.imageUrl ?? undefined}
    >
      <ImageCardTitle>
        <Link className="line-clamp-3" href={link.url}>
          {link.details?.title ?? parsedUrl.host}
        </Link>
      </ImageCardTitle>
      <ImageCardBody />
      <ImageCardFooter>
        <div className="flex justify-between text-gray-500">
          <div className="my-auto">
            <Link className="line-clamp-1 hover:text-black" href={link.url}>
              {parsedUrl.host}
            </Link>
          </div>
          <LinkOptions />
        </div>
      </ImageCardFooter>
    </ImageCard>
  );
}
