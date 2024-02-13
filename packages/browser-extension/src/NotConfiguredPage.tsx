import { useNavigate } from "react-router-dom";

export default function NotConfiguredPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col space-y-2">
      <span>To use the plugin, you need to configure it first.</span>
      <button
        className="bg-black text-white"
        onClick={() => navigate("/options")}
      >
        Configure
      </button>
    </div>
  );
}
