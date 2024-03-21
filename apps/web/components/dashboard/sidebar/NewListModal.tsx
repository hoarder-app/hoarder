"use client";

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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { create } from "zustand";

export const useNewListModal = create<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open: boolean) => set(() => ({ open })),
}));

export default function NewListModal() {
  const { open, setOpen } = useNewListModal();

  const formSchema = z.object({
    name: z.string(),
    icon: z.string(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "🚀",
    },
  });

  const listsInvalidationFunction = api.useUtils().lists.list.invalidate;

  const { mutate: createList, isPending } = api.lists.create.useMutation({
    onSuccess: () => {
      toast({
        description: "List has been created!",
      });
      listsInvalidationFunction();
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

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        form.reset();
        setOpen(s);
      }}
    >
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((value) => {
              createList(value);
            })}
          >
            <DialogHeader>
              <DialogTitle>New List</DialogTitle>
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
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <ActionButton type="submit" loading={isPending}>
                Create
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
