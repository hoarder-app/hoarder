import ApiKeySettings from "./components/ApiKeySettings";
export default async function Settings() {
  return (
    <div className="m-4 flex flex-col space-y-2 rounded-md border bg-white p-4">
      <p className="text-2xl">Settings</p>
      <ApiKeySettings />
    </div>
  );
}
