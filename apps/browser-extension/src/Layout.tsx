import { Outlet } from "react-router-dom";
import { Home, RefreshCw, Settings, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import usePluginSettings from "./utils/settings";

export default function Layout() {
  const navigate = useNavigate();
  const { settings, isPending: isInit } = usePluginSettings();
  if (!isInit) {
    return <div className="p-4">Loading ... </div>;
  }

  if (!settings.apiKey || !settings.address) {
    navigate("/notconfigured");
    return;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="rounded-md bg-yellow-100 p-4">
        <Outlet />
      </div>
      <hr />
      <div className="flex justify-between space-x-3">
        <div className="my-auto">
          <a
            className="flex gap-2 text-black"
            target="_blank"
            href={`${settings.address}/dashboard/bookmarks`}
          >
            <Home />
            <span className="text-md my-auto">Bookmarks</span>
          </a>
        </div>
        <div className="flex space-x-3">
          {process.env.NODE_ENV == "development" && (
            <button onClick={() => navigate(0)}>
              <RefreshCw className="w-4" />
            </button>
          )}
          <button onClick={() => navigate("/options")}>
            <Settings className="w-4" />
          </button>
          <button onClick={() => window.close()}>
            <X className="w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
