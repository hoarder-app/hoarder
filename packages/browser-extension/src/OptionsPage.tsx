import { useRef, useState } from "react";
import usePluginSettings from "./settings";

export default function OptionsPage() {
  const [settings, setSettings, _1, _2, _3] = usePluginSettings();

  const apiKeyRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-lg">Settings</span>
      <hr />
      <p className="text-red-500">{error}</p>
      <div className="flex space-x-2">
        <label className="m-auto h-full">Server Address</label>
        <input
          ref={addressRef}
          defaultValue={settings.address || "https://demo.hoarder.app"}
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <div className="flex space-x-2 pt-2">
        <label className="m-auto h-full">API Key</label>
        <input
          ref={apiKeyRef}
          defaultValue={settings.apiKey}
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <button className="rounded-lg border border-gray-200" onClick={onSave}>
        {isSaved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
