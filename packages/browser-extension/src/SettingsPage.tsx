import { useRef } from "react";
import usePluginSettings from "./settings";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings, _1, _2, _3] = usePluginSettings();

  const apiKeyRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const onSave = () => {
    setSettings({
      apiKey: apiKeyRef.current?.value || "",
      address: addressRef.current?.value || "",
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-lg">Settings</span>
      <hr />
      <div className="flex space-x-2 pt-2">
        <label className="m-auto h-full">API Key</label>
        <input
          ref={apiKeyRef}
          defaultValue={settings.apiKey}
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <div className="flex space-x-2">
        <label className="m-auto h-full">Server Address</label>
        <input
          ref={addressRef}
          defaultValue={settings.address}
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
        />
      </div>
      <button
        className="rounded-lg border border-gray-200"
        onClick={onSave}
      >
        Save
      </button>
      <button
        className="rounded-lg border border-gray-200"
        onClick={() => navigate("/")}
      >
        Back
      </button>
    </div>
  );
}
