import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePluginSettings from "./utils/settings";
import Logo from "./Logo";

export default function NotConfiguredPage() {
  const navigate = useNavigate();

  const { settings, setSettings } = usePluginSettings();

  const [error, setError] = useState("");
  const [serverAddress, setServerAddress] = useState(settings.address);
  useEffect(() => {
    setServerAddress(settings.address);
  }, [settings.address]);

  const onSave = () => {
    if (serverAddress == "") {
      setError("Server address is required");
      return;
    }
    setSettings((s) => ({ ...s, address: serverAddress }));
    navigate("/signin");
  };

  return (
    <div className="flex flex-col space-y-2">
      <Logo />
      <span className="pt-3">
        To use the plugin, you need to configure it first.
      </span>
      <p className="text-red-500">{error}</p>
      <div className="flex gap-2">
        <label className="my-auto">Server Address</label>
        <input
          name="address"
          value={serverAddress}
          className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
          onChange={(e) => setServerAddress(e.target.value)}
        />
      </div>
      <button className="bg-black text-white" onClick={onSave}>
        Configure
      </button>
    </div>
  );
}
