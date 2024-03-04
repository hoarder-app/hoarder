import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/spinner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function AddToListModal({
  bookmarkId,
  open,
  setOpen,
}: {
  bookmarkId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const formSchema = z.object({
    listId: z.string({
      required_error: "Please select a list",
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { data: lists, isPending: isFetchingListsPending } =
    api.lists.list.useQuery();

  const listInvalidationFunction = api.useUtils().lists.get.invalidate;
  const bookmarksInvalidationFunction =
    api.useUtils().bookmarks.getBookmarks.invalidate;

  const { mutate: addToList, isPending: isAddingToListPending } =
    api.lists.addToList.useMutation({
      onSuccess: (_resp, req) => {
        toast({
          description: "List has been updated!",
        });
        listInvalidationFunction({ listId: req.listId });
        bookmarksInvalidationFunction();
      },
      onError: (e) => {
        if (e.data?.code == "BAD_REQUEST") {
          toast({
            variant: "destructive",
            description: e.message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Something went wrong",
          });
        }
      },
    });

  const isPending = isFetchingListsPending || isAddingToListPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((value) => {
              addToList({
                bookmarkId: bookmarkId,
                listId: value.listId,
              });
            })}
          >
            <DialogHeader>
              <DialogTitle>Add to List</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {lists ? (
                <FormField
                  control={form.control}
                  name="listId"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormControl>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a list" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {lists &&
                                  lists.lists.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                      {l.icon} {l.name}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              ) : (
                <LoadingSpinner />
              )}
            </div>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <ActionButton
                type="submit"
                loading={isAddingToListPending}
                disabled={isPending}
              >
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function useAddToListModal(bookmarkId: string) {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    content: (
      <AddToListModal bookmarkId={bookmarkId} open={open} setOpen={setOpen} />
    ),
  };
}
