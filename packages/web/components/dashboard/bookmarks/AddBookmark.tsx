"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil, Plus } from "lucide-react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { BookmarkedTextEditor } from "./BookmarkedTextEditor";
import { useState } from "react";

function AddText() {
  const [isEditorOpen, setEditorOpen] = useState(false);

  return (
    <div className="flex">
      <BookmarkedTextEditor open={isEditorOpen} setOpen={setEditorOpen} />
      <Button className="m-auto" onClick={() => setEditorOpen(true)}>
        <Pencil />
      </Button>
    </div>
  );
}

function AddLink() {
  const formSchema = z.object({
    url: z.string().url({ message: "The link must be a valid URL" }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const invalidateBookmarksCache = api.useUtils().bookmarks.invalidate;
  const createBookmarkMutator = api.bookmarks.createBookmark.useMutation({
    onSuccess: () => {
      invalidateBookmarksCache();
      form.reset();
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const onError: SubmitErrorHandler<z.infer<typeof formSchema>> = (errors) => {
    toast({
      description: Object.values(errors)
        .map((v) => v.message)
        .join("\n"),
      variant: "destructive",
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex-grow"
        onSubmit={form.handleSubmit(
          (value) =>
            createBookmarkMutator.mutate({ url: value.url, type: "link" }),
          onError,
        )}
      >
        <div className="flex w-full items-center space-x-2 py-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => {
              return (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="text" placeholder="Link" {...field} />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <ActionButton type="submit" loading={createBookmarkMutator.isPending}>
            <Plus />
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default function AddBookmark() {
  return (
    <div className="container flex gap-2">
      <AddLink />
      <AddText />
    </div>
  );
}
