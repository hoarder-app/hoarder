import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useMergeLists } from "@hoarder/shared-react/hooks/lists";
import { ZBookmarkList, zMergeListSchema } from "@hoarder/shared/types/lists";

import { BookmarkListSelector } from "./BookmarkListSelector";

export function MergeListModal({
  open: userOpen,
  setOpen: userSetOpen,
  list,
  prefill,
  children,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  list?: ZBookmarkList;
  prefill?: ZBookmarkList;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (
    (userOpen !== undefined && !userSetOpen) ||
    (userOpen === undefined && userSetOpen)
  ) {
    throw new Error("You must provide both open and setOpen or neither");
  }
  const [customOpen, customSetOpen] = useState(false);
  const form = useForm<z.infer<typeof zMergeListSchema>>({
    resolver: zodResolver(zMergeListSchema),
    defaultValues: {
      listId: list?.id ?? prefill?.id ?? "",
      sourceName: list?.name ?? prefill?.name ?? "",
      sourceIcon: list?.icon ?? prefill?.icon ?? "🚀",
      targetId: prefill?.id ?? "",
    },
  });
  const [open, setOpen] = [
    userOpen ?? customOpen,
    userSetOpen ?? customSetOpen,
  ];

  useEffect(() => {
    form.reset({
      listId: list?.id ?? prefill?.id ?? "",
      sourceName: list?.name ?? prefill?.name ?? "",
      sourceIcon: list?.icon ?? prefill?.icon ?? "🚀",
      targetId: prefill?.id ?? "",
    });
  }, [open]);

  const { mutate: mergeLists, isPending: isMerging } = useMergeLists({
    onSuccess: (resp) => {
      if (resp.totalItems === 0) {
        toast({
          description: "List is empty, no bookmarks to merge",
          variant: "destructive",
        });
      } else if (resp.addedCount > 0 && resp.duplicateCount > 0) {
        toast({
          description: `Merged ${resp.addedCount} bookmarks and skipped ${resp.duplicateCount} bookmarks that already existed`,
          variant: "default",
        });
      } else if (resp.addedCount > 0) {
        toast({
          description: `Successfully merged ${resp.addedCount} bookmarks`,
          variant: "default",
        });
      } else if (resp.duplicateCount > 0) {
        toast({
          description: `${resp.duplicateCount} bookmarks already existed in the target list`,
          variant: "default",
        });
      }

      if (resp.failedCount > 0) {
        toast({
          description: `Failed to merge ${resp.failedCount} bookmarks`,
          variant: "destructive",
        });
      }

      setOpen(false);
      form.reset();
    },
    onError: (e) => {
      if (e.data?.code == "BAD_REQUEST") {
        if (e.data.zodError) {
          toast({
            variant: "destructive",
            description: Object.values(e.data.zodError.fieldErrors)
              .flat()
              .join("\n"),
          });
        } else {
          toast({
            variant: "destructive",
            description: e.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: t("common.something_went_wrong"),
        });
      }
    },
  });

  const onSubmit = form.handleSubmit(
    async (value: z.infer<typeof zMergeListSchema>) => {
      mergeLists(value);
    },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        form.reset();
        setOpen(s);
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{t("lists.merge_list")}</DialogTitle>
            </DialogHeader>
            <div className="flex w-full gap-2 py-4">
              <FormField
                control={form.control}
                name="sourceIcon"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger className="h-full rounded border border-input px-2 text-2xl">
                          {field.value}
                        </PopoverTrigger>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceName"
                render={({ field }) => {
                  return (
                    <FormItem className="grow">
                      <FormControl>
                        <Input
                          type="text"
                          className="w-full"
                          placeholder="List Name"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="targetId"
              render={({ field }) => (
                <FormItem className="grow pb-4">
                  <FormLabel>{t("lists.destination_list")}</FormLabel>
                  <div className="flex items-center gap-1">
                    <FormControl>
                      <BookmarkListSelector
                        // Hide the current list
                        hideSubtreeOf={list ? list.id : undefined}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("lists.no_destination")}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        form.reset({ targetId: "" });
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </DialogClose>
              <ActionButton
                type="submit"
                onClick={onSubmit}
                loading={isMerging}
              >
                {t("actions.merge")}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
