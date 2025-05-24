import { api } from "../trpc";

export function useUpdateUserSettings(
  ...opts: Parameters<typeof api.users.updateSettings.useMutation>
) {
  const apiUtils = api.useUtils();
  return api.users.updateSettings.useMutation({
    ...opts[0],
    onSuccess: (res, req, meta) => {
      apiUtils.users.settings.invalidate();
      return opts[0]?.onSuccess?.(res, req, meta);
    },
  });
}
