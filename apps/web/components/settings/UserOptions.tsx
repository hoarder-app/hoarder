"use client";

import { useTranslation } from "@/lib/i18n/client";
import { useInterfaceLang } from "@/lib/userLocalSettings/bookmarksLayout";
import { updateInterfaceLang } from "@/lib/userLocalSettings/userLocalSettings";

import { langNameMappings } from "@karakeep/shared/langs";

import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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

export function UserOptions() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        {t("settings.info.options")}
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label>{t("settings.info.interface_lang")}</Label>
        <LanguageSelect />
      </div>
    </div>
  );
}
