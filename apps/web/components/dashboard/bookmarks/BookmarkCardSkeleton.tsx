import {
  ImageCard,
  ImageCardBanner,
  ImageCardBody,
  ImageCardContent,
  ImageCardFooter,
  ImageCardTitle,
} from "@/components/ui/imageCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookmarkCardSkeleton() {
  return (
    <ImageCard
      className={
        "border-grey-100 border bg-gray-50 duration-300 ease-in hover:border-blue-300 hover:transition-all"
      }
    >
      <ImageCardBanner src="/blur.avif" />
      <ImageCardContent>
        <ImageCardTitle></ImageCardTitle>
        <ImageCardBody className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </ImageCardBody>
        <ImageCardFooter></ImageCardFooter>
      </ImageCardContent>
    </ImageCard>
  );
}
