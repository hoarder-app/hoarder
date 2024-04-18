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
import { toast } from "@/components/ui/use-toast";
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
  parent,
  children,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  list?: ZBookmarkList;
  parent?: ZBookmarkList;
  children?: React.ReactNode;
}) {
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
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: list?.name ?? "",
      icon: list?.icon ?? "🚀",
      parentId: list?.parentId ?? parent?.id,
    },
  });
  const [open, setOpen] = [
    userOpen ?? customOpen,
    userSetOpen ?? customSetOpen,
  ];

  useEffect(() => {
    form.reset({
      name: list?.name ?? "",
      icon: list?.icon ?? "🚀",
      parentId: list?.parentId ?? parent?.id,
    });
  }, [open]);

  const { mutate: createList, isPending: isCreating } = useCreateBookmarkList({
    onSuccess: (resp) => {
      toast({
        description: "List has been created!",
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
          title: "Something went wrong",
        });
      }
    },
  });

  const { mutate: editList, isPending: isEditing } = useEditBookmarkList({
    onSuccess: () => {
      toast({
        description: "List has been updated!",
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
          title: "Something went wrong",
        });
      }
    },
  });

  const isEdit = !!list;
  const isPending = isCreating || isEditing;

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
          <form
            onSubmit={form.handleSubmit((value) => {
              value.parentId = value.parentId === "" ? null : value.parentId;
              isEdit
                ? editList({ ...value, listId: list.id })
                : createList(value);
            })}
          >
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
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <ActionButton type="submit" loading={isPending}>
                {list ? "Save" : "Create"}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
