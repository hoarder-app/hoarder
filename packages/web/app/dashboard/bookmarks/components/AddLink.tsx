"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { ActionButton } from "@/components/ui/action-button";

const formSchema = z.object({
  url: z.string().url({ message: "The link must be a valid URL" }),
});

export default function AddLink() {
  const router = useRouter();
  const bookmarkLinkMutator = api.bookmarks.bookmarkLink.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
        onSubmit={form.handleSubmit(
          (value) =>
            bookmarkLinkMutator.mutate({ url: value.url, type: "link" }),
          onError,
        )}
      >
        <div className="container flex w-full items-center space-x-2 py-4">
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
          <ActionButton type="submit" loading={bookmarkLinkMutator.isPending}>
            <Plus />
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}
