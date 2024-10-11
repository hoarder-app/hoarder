import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import ActionConfirmingDialog from "@/components/ui/action-confirming-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import FilePickerButton from "@/components/ui/file-picker-button";
import { toast } from "@/components/ui/use-toast";
import useUpload from "@/lib/hooks/upload-file";
import {
  Archive,
  Camera,
  ChevronsDownUp,
  Download,
  Image,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useAttachBookmarkAsset,
  useDetachBookmarkAsset,
  useReplaceBookmarkAsset,
} from "@hoarder/shared-react/hooks/bookmarks";
import { getAssetUrl } from "@hoarder/shared-react/utils/assetUtils";
import {
  BookmarkTypes,
  ZAssetType,
  ZBookmark,
} from "@hoarder/shared/types/bookmarks";
import {
  humanFriendlyNameForAssertType,
  isAllowedToAttachAsset,
  isAllowedToDetachAsset,
} from "@hoarder/trpc/lib/attachments";

export default function AttachmentBox({ bookmark }: { bookmark: ZBookmark }) {
  const typeToIcon: Record<ZAssetType, React.ReactNode> = {
    screenshot: <Camera className="size-4" />,
    fullPageArchive: <Archive className="size-4" />,
    bannerImage: <Image className="size-4" />,
    video: <Paperclip className="size-4" />,
    bookmarkAsset: <Paperclip className="size-4" />,
    unknown: <Paperclip className="size-4" />,
  };

  const { mutate: attachAsset, isPending: isAttaching } =
    useAttachBookmarkAsset({
      onSuccess: () => {
        toast({
          description: "Attachment has been attached!",
        });
      },
      onError: (e) => {
        toast({
          description: e.message,
          variant: "destructive",
        });
      },
    });

  const { mutate: replaceAsset, isPending: isReplacing } =
    useReplaceBookmarkAsset({
      onSuccess: () => {
        toast({
          description: "Attachment has been replaced!",
        });
      },
      onError: (e) => {
        toast({
          description: e.message,
          variant: "destructive",
        });
      },
    });

  const { mutate: detachAsset, isPending: isDetaching } =
    useDetachBookmarkAsset({
      onSuccess: () => {
        toast({
          description: "Attachment has been detached!",
        });
      },
      onError: (e) => {
        toast({
          description: e.message,
          variant: "destructive",
        });
      },
    });

  const { mutate: uploadAsset } = useUpload({
    onError: (e) => {
      toast({
        description: e.error,
        variant: "destructive",
      });
    },
  });

  bookmark.assets.sort((a, b) => a.assetType.localeCompare(b.assetType));

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-sm text-gray-400">
        Attachments
        <ChevronsDownUp className="size-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 py-2 text-sm">
        {bookmark.assets.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between">
            <Link
              target="_blank"
              href={getAssetUrl(asset.id)}
              className="flex items-center gap-1"
            >
              {typeToIcon[asset.assetType]}
              <p>{humanFriendlyNameForAssertType(asset.assetType)}</p>
            </Link>
            <div className="flex gap-2">
              <Link
                title="Download"
                target="_blank"
                href={getAssetUrl(asset.id)}
                className="flex items-center gap-1"
                download={humanFriendlyNameForAssertType(asset.assetType)}
              >
                <Download className="size-4" />
              </Link>
              {isAllowedToAttachAsset(asset.assetType) && (
                <FilePickerButton
                  title="Replace"
                  loading={isReplacing}
                  accept=".jgp,.JPG,.jpeg,.png,.webp"
                  multiple={false}
                  variant="none"
                  size="none"
                  className="flex items-center gap-2"
                  onFileSelect={(file) =>
                    uploadAsset(file, {
                      onSuccess: (resp) => {
                        replaceAsset({
                          bookmarkId: bookmark.id,
                          oldAssetId: asset.id,
                          newAssetId: resp.assetId,
                        });
                      },
                    })
                  }
                >
                  <Pencil className="size-4" />
                </FilePickerButton>
              )}
              {isAllowedToDetachAsset(asset.assetType) && (
                <ActionConfirmingDialog
                  title="Delete Attachment?"
                  description={`Are you sure you want to delete the attachment of the bookmark?`}
                  actionButton={(setDialogOpen) => (
                    <ActionButton
                      loading={isDetaching}
                      variant="destructive"
                      onClick={() =>
                        detachAsset(
                          { bookmarkId: bookmark.id, assetId: asset.id },
                          { onSettled: () => setDialogOpen(false) },
                        )
                      }
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </ActionButton>
                  )}
                >
                  <Button variant="none" size="none" title="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </ActionConfirmingDialog>
              )}
            </div>
          </div>
        ))}
        {!bookmark.assets.some((asset) => asset.assetType == "bannerImage") &&
          bookmark.content.type != BookmarkTypes.ASSET && (
            <FilePickerButton
              title="Attach a Banner"
              loading={isAttaching}
              accept=".jgp,.JPG,.jpeg,.png,.webp"
              multiple={false}
              variant="ghost"
              size="none"
              className="flex w-full items-center justify-center gap-2"
              onFileSelect={(file) =>
                uploadAsset(file, {
                  onSuccess: (resp) => {
                    attachAsset({
                      bookmarkId: bookmark.id,
                      asset: {
                        id: resp.assetId,
                        assetType: "bannerImage",
                      },
                    });
                  },
                })
              }
            >
              <Plus className="size-4" />
              Attach a Banner
            </FilePickerButton>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
