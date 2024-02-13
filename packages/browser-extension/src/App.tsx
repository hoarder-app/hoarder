import SavePage from "./SavePage";
import usePluginSettings from "./settings";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [settings, _1, _2, _3, isInit] = usePluginSettings();

  if (!isInit) {
    return <div className="p-4">Loading ... </div>;
  }

  if (!settings.apiKey || !settings.address) {
    navigate("/notconfigured");
    return;
  }

  return (
    <div className="flex flex-col space-y-2">
      <SavePage settings={settings} />
      <hr />
      <div className="flex justify-end">
        <button className="w-2/6" onClick={() => navigate("/options")}>
          Settings
        </button>
      </div>
    </div>
  );
}

export default App;
