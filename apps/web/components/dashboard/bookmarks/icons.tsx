import { Archive, ArchiveRestore, Star } from "lucide-react";

export function FavouritedActionIcon({
  favourited,
  className,
}: {
  favourited: boolean;
  className?: string;
}) {
  return favourited ? (
    <Star className={className} color="#ebb434" fill="#ebb434" />
  ) : (
    <Star className={className} />
  );
}

export function ArchivedActionIcon({
  archived,
  className,
}: {
  archived: boolean;
  className?: string;
}) {
  return archived ? (
    <ArchiveRestore className={className} />
  ) : (
    <Archive className={className} />
  );
}
