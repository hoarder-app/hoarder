"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { addPasskey, deletePasskey, listPasskeys } from "@/lib/auth/client";
import type { PasskeyInfo } from "@/lib/auth/client";
import { useTranslation } from "@/lib/i18n/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";

import { SettingsSection } from "./SettingsPage";

export default function PasskeySettings() {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const passkeys = useQuery({
    queryKey: ["passkeys"],
    queryFn: async (): Promise<PasskeyInfo[]> => {
      const resp = await listPasskeys();
      return resp.passkeys;
    },
  });

  const add = useMutation({
    mutationFn: async (keyName?: string) => {
      const resp = await addPasskey(keyName);
      if (!resp.ok) {
        throw new Error(resp.error ?? t("settings.passkeys.add_error"));
      }
    },
    onSuccess: () => {
      toast({ description: t("settings.passkeys.added_toast") });
      setName("");
      void passkeys.refetch();
    },
    onError: (e) => {
      toast({ description: e.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const resp = await deletePasskey(id);
      if (!resp.ok) {
        throw new Error(resp.error ?? t("settings.passkeys.remove_error"));
      }
    },
    onSuccess: () => {
      toast({ description: t("settings.passkeys.removed_toast") });
      void passkeys.refetch();
    },
    onError: (e) => {
      toast({ description: e.message, variant: "destructive" });
    },
  });

  return (
    <SettingsSection id="passkeys" title={t("settings.passkeys.title")}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("settings.passkeys.description")}
      </p>

      <div className="mb-4 space-y-2">
        {passkeys.data && passkeys.data.length > 0 ? (
          passkeys.data.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {pk.name || t("settings.passkeys.default_name")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("settings.passkeys.remove")}
                disabled={remove.isPending}
                onClick={() => remove.mutate(pk.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {passkeys.isLoading
              ? t("settings.passkeys.loading")
              : t("settings.passkeys.empty")}
          </p>
        )}
      </div>

      <div className="max-w-sm space-y-2">
        <Label htmlFor="passkey-name">
          {t("settings.passkeys.name_label")}
        </Label>
        <Input
          id="passkey-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("settings.passkeys.name_placeholder")}
          className="h-11"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <ActionButton
          type="button"
          loading={add.isPending}
          onClick={() => add.mutate(name.trim() || undefined)}
        >
          {t("settings.passkeys.add")}
        </ActionButton>
      </div>
    </SettingsSection>
  );
}
