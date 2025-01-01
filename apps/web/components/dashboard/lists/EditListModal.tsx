import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useCreateBookmarkList,
  useEditBookmarkList,
} from "@hoarder/shared-react/hooks/lists";
import { ZBookmarkList } from "@hoarder/shared/types/lists";

import { BookmarkListSelector } from "./BookmarkListSelector";

export function EditListModal({
  open: userOpen,
  setOpen: userSetOpen,
  list,
  prefill,
  children,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  list?: ZBookmarkList;
  prefill?: Partial<Omit<ZBookmarkList, "id">>;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  if (
    (userOpen !== undefined && !userSetOpen) ||
    (userOpen === undefined && userSetOpen)
  ) {
    throw new Error("You must provide both open and setOpen or neither");
  }
  const [customOpen, customSetOpen] = useState(false);
  const formSchema = z.object({
    name: z.string(),
    icon: z.string(),
    parentId: z.string().nullish(),
    type: z.enum(["manual", "smart"]).default("manual"),
    query: z.string().optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: list?.name ?? prefill?.name ?? "",
      icon: list?.icon ?? prefill?.icon ?? "🚀",
      parentId: list?.parentId ?? prefill?.parentId,
      type: list?.type ?? prefill?.type ?? "manual",
      query: list?.query ?? prefill?.query ?? undefined,
    },
  });
  const [open, setOpen] = [
    userOpen ?? customOpen,
    userSetOpen ?? customSetOpen,
  ];

  useEffect(() => {
    form.reset({
      name: list?.name ?? prefill?.name ?? "",
      icon: list?.icon ?? prefill?.icon ?? "🚀",
      parentId: list?.parentId ?? prefill?.parentId,
      type: list?.type ?? prefill?.type ?? "manual",
      query: list?.query ?? prefill?.query ?? undefined,
    });
  }, [open]);

  const { mutate: createList, isPending: isCreating } = useCreateBookmarkList({
    onSuccess: (resp) => {
      toast({
        description: t("toasts.lists.created"),
      });
      setOpen(false);
      router.push(`/dashboard/lists/${resp.id}`);
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

  const { mutate: editList, isPending: isEditing } = useEditBookmarkList({
    onSuccess: () => {
      toast({
        description: t("toasts.lists.updated"),
      });
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
  const listType = form.watch("type");

  const isEdit = !!list;
  const isPending = isCreating || isEditing;

  const onSubmit = form.handleSubmit((value: z.infer<typeof formSchema>) => {
    value.parentId = value.parentId === "" ? null : value.parentId;
    value.query = value.type === "smart" ? value.query : undefined;
    isEdit ? editList({ ...value, listId: list.id }) : createList(value);
  });

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
              <DialogTitle>{isEdit ? "Edit" : "New"} List</DialogTitle>
            </DialogHeader>
            <div className="flex w-full gap-2 py-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger className="h-full rounded border border-input px-2 text-2xl">
                            {field.value}
                          </PopoverTrigger>
                          <PopoverContent>
                            <Picker
                              data={data}
                              onEmojiSelect={(e: { native: string }) =>
                                field.onChange(e.native)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem className="grow">
                      <FormControl>
                        <Input
                          type="text"
                          className="w-full"
                          placeholder="List Name"
                          {...field}
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
              name="parentId"
              render={({ field }) => {
                return (
                  <FormItem className="grow pb-4">
                    <FormLabel>Parent</FormLabel>
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <BookmarkListSelector
                          // Hide the current list from the list of parents
                          hideSubtreeOf={list ? list.id : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={"No Parent"}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          form.reset({ parentId: null });
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => {
                return (
                  <FormItem className="grow pb-4">
                    <FormLabel>List Type</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isEdit}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="smart">Smart</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {listType === "smart" && (
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => {
                  return (
                    <FormItem className="grow pb-4">
                      <FormLabel>Search Query</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={"Query"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("actions.close")}
                </Button>
              </DialogClose>
              <ActionButton
                type="submit"
                onClick={onSubmit}
                loading={isPending}
              >
                {list ? t("actions.save") : t("actions.create")}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
