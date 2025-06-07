"use client";

import { useEffect } from "react";
import { useClientConfig } from "@/lib/clientConfig";
import { useTranslation } from "@/lib/i18n/client";
import { useInterfaceLang } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateInterfaceLang } from "@/lib/userLocalSettings/userLocalSettings";
import { useUserSettings } from "@/lib/userSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, Bookmark, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateUserSettings } from "@karakeep/shared-react/hooks/users";
import { langNameMappings } from "@karakeep/shared/langs";
import {
  ZUserSettings,
  zUserSettingsSchema,
} from "@karakeep/shared/types/users";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form, FormField } from "../ui/form";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
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
      <SelectTrigger className="h-11">
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

export default function UserOptions() {
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
    open_original_link: t(
      "settings.info.user_settings.bookmark_click_action.open_external_url",
    ),
    expand_bookmark_preview: t(
      "settings.info.user_settings.bookmark_click_action.open_bookmark_details",
    ),
  };

  const archiveDisplayBehaviourTranslation: Record<
    ZUserSettings["archiveDisplayBehaviour"],
    string
  > = {
    show: t("settings.info.user_settings.archive_display_behaviour.show"),
    hide: t("settings.info.user_settings.archive_display_behaviour.hide"),
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("settings.info.options")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.info.interface_lang")}
            </Label>
            <LanguageSelect />
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bookmarkClickAction"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Bookmark className="h-4 w-4" />
                    {t(
                      "settings.info.user_settings.bookmark_click_action.title",
                    )}
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
                    <SelectTrigger className="h-11">
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

            <FormField
              control={form.control}
              name="archiveDisplayBehaviour"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Archive className="h-4 w-4" />
                    {t(
                      "settings.info.user_settings.archive_display_behaviour.title",
                    )}
                  </Label>
                  <Select
                    disabled={!!clientConfig.demoMode}
                    value={field.value}
                    onValueChange={(value) => {
                      mutate({
                        archiveDisplayBehaviour:
                          value as ZUserSettings["archiveDisplayBehaviour"],
                      });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue>
                        {archiveDisplayBehaviourTranslation[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(archiveDisplayBehaviourTranslation).map(
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
          </div>
        </CardContent>
      </Card>
    </Form>
  );
}
