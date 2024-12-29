"use client";

import type { SubmitErrorHandler } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import CopyBtn from "@/components/ui/copy-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

function ApiKeySuccess({ apiKey }: { apiKey: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="py-4">
        {t("settings.api_keys.key_success_please_copy")}
      </div>
      <div className="flex space-x-2 pt-2">
        <Input value={apiKey} readOnly />
        <CopyBtn
          getStringToCopy={() => {
            return apiKey;
          }}
        />
      </div>
    </div>
  );
}

function AddApiKeyForm({ onSuccess }: { onSuccess: (key: string) => void }) {
  const { t } = useTranslation();
  const formSchema = z.object({
    name: z.string(),
  });
  const router = useRouter();
  const mutator = api.apiKeys.create.useMutation({
    onSuccess: (resp) => {
      onSuccess(resp.key);
      router.refresh();
    },
    onError: () => {
      toast({
        description: t("common.something_went_wrong"),
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(value: z.infer<typeof formSchema>) {
    mutator.mutate({ name: value.name });
  }

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
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex w-full space-x-3 space-y-8 pt-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => {
            return (
              <FormItem className="flex-1">
                <FormLabel>{t("common.name")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("common.name")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("settings.api_keys.new_api_key_desc")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <ActionButton
          className="h-full"
          type="submit"
          loading={mutator.isPending}
        >
          {t("actions.create")}
        </ActionButton>
      </form>
    </Form>
  );
}

export default function AddApiKey() {
  const { t } = useTranslation();
  const [key, setKey] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>{t("settings.api_keys.new_api_key")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {key
              ? t("settings.api_keys.key_success")
              : t("settings.api_keys.new_api_key")}
          </DialogTitle>
          <DialogDescription>
            {key ? (
              <ApiKeySuccess apiKey={key} />
            ) : (
              <AddApiKeyForm onSuccess={setKey} />
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => setKey(undefined)}
            >
              {t("actions.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
