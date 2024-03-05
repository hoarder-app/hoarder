import React, { useEffect, useRef, useState } from "react";
import usePluginSettings from "./utils/settings";
import { api } from "./utils/trpc";
import Spinner from "./Spinner";

export default function OptionsPage() {
  const [settings, setSettings, _1, _2, _3] = usePluginSettings();

  const apiKeyRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const [settingsInput, setSettingsInput] = useState<typeof settings>(settings);

  useEffect(() => {
    setSettingsInput(settings);
  }, [settings]);

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: whoami,
    isPending: isWhoAmiPending,
    error: whoAmIError,
  } = api.users.whoami.useQuery();

  const invalidateWhoami = api.useUtils().users.whoami.invalidate;

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

  const onSave = () => {
    if (apiKeyRef.current?.value == "") {
      setError("API Key can't be empty");
      return;
    }
    if (addressRef.current?.value == "") {
      setError("Server addres can't be empty");
      return;
    }
    setSettings({
      apiKey: apiKeyRef.current?.value || "",
      address: addressRef.current?.value || "https://demo.hoarder.app",
    });
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
    setIsSaved(true);
    invalidateWhoami();
  };

  const onLogout = () => {
    setSettings((s) => ({ ...s, apiKey: "" }));
    invalidateWhoami();
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-lg">Settings</span>
      <hr />
      <p className="text-red-500">{error}</p>
      <div className="flex gap-2">
        <span className="my-auto">Logged in as:</span>
        {loggedInMessage}
      </div>
      <div className="flex space-x-2">
        <label className="m-auto h-full">Server Address</label>
        <input
          ref={addressRef}
          value={settingsInput.address}
          onChange={(e) =>
            setSettingsInput((s) => ({ ...s, address: e.target.value }))
          }
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <div className="flex space-x-2">
        <label className="m-auto h-full">API Key</label>
        <input
          ref={apiKeyRef}
          value={settingsInput.apiKey}
          onChange={(e) =>
            setSettingsInput((s) => ({ ...s, apiKey: e.target.value }))
          }
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <button className="rounded-lg border border-gray-200" onClick={onSave}>
        {isSaved ? "Saved!" : "Save"}
      </button>
      <button className="rounded-lg border border-gray-200" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
