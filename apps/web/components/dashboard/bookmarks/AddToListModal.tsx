import { useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAddBookmarkToList } from "@hoarder/shared-react/hooks/lists";

import { BookmarkListSelector } from "../lists/BookmarkListSelector";

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

  const { mutate: addToList, isPending: isAddingToListPending } =
    useAddBookmarkToList({
      onSuccess: () => {
        toast({
          description: "List has been updated!",
        });
        setOpen(false);
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
              <FormField
                control={form.control}
                name="listId"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <BookmarkListSelector onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
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
                disabled={isAddingToListPending}
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
