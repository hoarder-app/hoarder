import React, { useEffect } from "react";
import usePluginSettings from "./utils/settings";
import { api } from "./utils/trpc";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";

export default function OptionsPage() {
  const navigate = useNavigate();
  const { settings, setSettings } = usePluginSettings();

  const {
    data: whoami,
    isPending: isWhoAmiPending,
    error: whoAmIError,
  } = api.users.whoami.useQuery();

  const invalidateWhoami = api.useUtils().users.whoami.refetch;

  useEffect(() => {
    invalidateWhoami();
  }, [settings, invalidateWhoami]);

  let loggedInMessage: React.ReactNode;
  if (whoAmIError) {
    if (whoAmIError.data?.code == "UNAUTHORIZED") {
      loggedInMessage = <span>Not logged in</span>;
    } else {
      loggedInMessage = (
        <span>Something went wrong: {whoAmIError.message}</span>
      );
    }
  }
  if (isWhoAmiPending) {
    loggedInMessage = <Spinner />;
  }
  if (whoami) {
    loggedInMessage = <span>{whoami.name}</span>;
  }

  const onLogout = () => {
    setSettings((s) => ({ ...s, apiKey: "" }));
    invalidateWhoami();
    navigate("/notconfigured");
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-lg">Settings</span>
      <hr />
      <div className="flex gap-2">
        <span className="my-auto">Logged in as:</span>
        {loggedInMessage}
      </div>
      <button className="rounded-lg border border-gray-200" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
