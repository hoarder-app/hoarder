import type { SubmitErrorHandler, SubmitHandler } from "react-hook-form";
import { useEffect, useImperativeHandle, useRef } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Form, FormControl, FormItem } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useClientConfig } from "@/lib/clientConfig";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function useFocusOnKeyPress(inputRef: React.RefObject<HTMLTextAreaElement>) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (!inputRef.current) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyE") {
        inputRef.current.focus();
      }
    }
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [inputRef]);
}

export default function EditorCard({ className }: { className?: string }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const demoMode = !!useClientConfig().demoMode;
  const formSchema = z.object({
    text: z.string(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });
  const { ref, ...textFieldProps } = form.register("text");
  useImperativeHandle(ref, () => inputRef.current);
  useFocusOnKeyPress(inputRef);

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
        <div className="flex justify-between">
          <p className="text-sm">NEW ITEM</p>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={15} />
              </TooltipTrigger>
              <TooltipContent className="w-52">
                <p className="text-center">
                  You can quickly focus on this field by pressing ⌘ + E
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Separator />
        <FormItem className="flex-1">
          <FormControl>
            <Textarea
              ref={inputRef}
              disabled={isPending}
              className="h-full w-full resize-none border-none text-lg focus-visible:ring-0"
              placeholder={
                "Paste a link, write a note or drag and drop an image in here ..."
              }
              onKeyDown={(e) => {
                if (demoMode) {
                  return;
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  form.handleSubmit(onSubmit, onError)();
                }
              }}
              {...textFieldProps}
            />
          </FormControl>
        </FormItem>
        <ActionButton loading={isPending} type="submit" variant="default">
          {form.formState.dirtyFields.text
            ? demoMode
              ? "Submissions are disabled"
              : "Press ⌘ + Enter to Save"
            : "Save"}
        </ActionButton>
      </form>
    </Form>
  );
}
