import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/trpc";

export function useShowArchived() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const { data } = api.users.settings.useQuery(undefined);
  const includeArchived = searchParams.get("includeArchived");
  const showArchived =
    includeArchived !== undefined
      ? includeArchived === "true"
      : data?.archiveDisplayBehaviour === "show";

  const onClickShowArchived = () => {
    router.replace(
      pathname +
        "?" +
        createQueryString("includeArchived", (!showArchived).toString()),
    );
  };

  return {
    showArchived,
    onClickShowArchived,
  };
}
