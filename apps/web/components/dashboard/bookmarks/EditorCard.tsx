import type { SubmitErrorHandler, SubmitHandler } from "react-hook-form";
import { ActionButton } from "@/components/ui/action-button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function EditorCard({ className }: { className?: string }) {
  const formSchema = z.object({
    text: z.string(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const invalidateBookmarksCache = api.useUtils().bookmarks.invalidate;
  const { mutate, isPending } = api.bookmarks.createBookmark.useMutation({
    onSuccess: () => {
      invalidateBookmarksCache();
      form.reset();
    },
    onError: () => {
      toast({ description: "Something went wrong", variant: "destructive" });
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    const text = data.text.trim();
    try {
      new URL(text);
      mutate({ type: "link", url: text });
    } catch (e) {
      // Not a URL
      mutate({ type: "text", text });
    }
  };
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
        className={cn(
          className,
          "flex h-96 flex-col gap-2 rounded-xl bg-card p-4",
        )}
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
        <p className="text-sm">NEW ITEM</p>
        <Separator />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => {
            return (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    disabled={isPending}
                    className="h-full w-full resize-none border-none text-lg focus-visible:ring-0"
                    placeholder={
                      "Paste a link, write a note or drag and drop an image in here ..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey) {
                        form.handleSubmit(onSubmit, onError)();
                      }
                    }}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        />
        <ActionButton loading={isPending} type="submit" variant="default">
          {form.formState.dirtyFields.text ? "Press ⌘ + Enter to Save" : "Save"}
        </ActionButton>
      </form>
    </Form>
  );
}
