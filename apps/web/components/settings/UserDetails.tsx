import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/server";
import { api } from "@/server/api/client";

export default async function UserDetails() {
  const { t } = await useTranslation();
  const whoami = await api.users.whoami();

  const details = [
    {
      label: t("common.name"),
      value: whoami.name ?? undefined,
    },
    {
      label: t("common.email"),
      value: whoami.email ?? undefined,
    },
  ];

  return (
    <div className="flex w-full flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        {t("settings.info.basic_details")}
      </div>
      <div className="w-full">
        {details.map(({ label, value }) => (
          <div className="mb-2" key={label}>
            <div className="mb-2 text-sm font-medium">{label}</div>
            <Input value={value} disabled />
          </div>
        ))}
      </div>
    </div>
  );
}
