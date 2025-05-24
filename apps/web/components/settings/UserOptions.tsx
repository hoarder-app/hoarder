"use client";

import { useEffect } from "react";
import { useClientConfig } from "@/lib/clientConfig";
import { useTranslation } from "@/lib/i18n/client";
import { useInterfaceLang } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateInterfaceLang } from "@/lib/userLocalSettings/userLocalSettings";
import { useUserSettings } from "@/lib/userSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateUserSettings } from "@karakeep/shared-react/hooks/users";
import { langNameMappings } from "@karakeep/shared/langs";
import {
  ZUserSettings,
  zUserSettingsSchema,
} from "@karakeep/shared/types/users";

import { Form, FormField } from "../ui/form";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "../ui/use-toast";

const LanguageSelect = () => {
  const lang = useInterfaceLang();
  return (
    <Select
      value={lang}
      onValueChange={async (val) => {
        await updateInterfaceLang(val);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(langNameMappings).map(([lang, name]) => (
          <SelectItem key={lang} value={lang}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default function UserSettings() {
  const { t } = useTranslation();
  const clientConfig = useClientConfig();
  const data = useUserSettings();
  const { mutate } = useUpdateUserSettings({
    onSuccess: () => {
      toast({
        description: t("settings.info.user_settings.user_settings_updated"),
      });
    },
    onError: () => {
      toast({
        description: t("common.something_went_wrong"),
        variant: "destructive",
      });
    },
  });

  const bookmarkClickActionTranslation: Record<
    ZUserSettings["bookmarkClickAction"],
    string
  > = {
    open_original_link: t("settings.info.user_settings.open_external_url"),
    expand_bookmark_preview: t(
      "settings.info.user_settings.open_bookmark_details",
    ),
  };

  const form = useForm<z.infer<typeof zUserSettingsSchema>>({
    resolver: zodResolver(zUserSettingsSchema),
    defaultValues: data,
  });

  // When the actual user setting is loaded, reset the form to the current value
  useEffect(() => {
    form.reset(data);
  }, [data]);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="bookmarkClickAction"
        render={({ field }) => (
          <div className="flex w-full flex-col gap-2">
            <Label>
              {t("settings.info.user_settings.boomark_click_action")}
            </Label>
            <Select
              disabled={!!clientConfig.demoMode}
              value={field.value}
              onValueChange={(value) => {
                mutate({
                  bookmarkClickAction:
                    value as ZUserSettings["bookmarkClickAction"],
                });
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {bookmarkClickActionTranslation[field.value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bookmarkClickActionTranslation).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      />
    </Form>
  );
}

export function UserOptions() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        {t("settings.info.options")}
      </div>
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-2">
          <Label>{t("settings.info.interface_lang")}</Label>
          <LanguageSelect />
        </div>
        <UserSettings />
      </div>
    </div>
  );
}
