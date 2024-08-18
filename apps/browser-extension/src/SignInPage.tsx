import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import Logo from "./Logo";
import usePluginSettings from "./utils/settings";
import { api } from "./utils/trpc";

export default function SignInPage() {
  const navigate = useNavigate();
  const { setSettings } = usePluginSettings();

  const {
    mutate: login,
    error,
    isPending,
  } = api.apiKeys.exchange.useMutation({
    onSuccess: (resp) => {
      setSettings((s) => ({ ...s, apiKey: resp.key, apiKeyId: resp.id }));
      navigate("/options");
    },
  });

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randStr = (Math.random() + 1).toString(36).substring(5);
    login({ ...formData, keyName: `Browser extension: (${randStr})` });
  };

  let errorMessage = "";
  if (error) {
    if (error.data?.code == "UNAUTHORIZED") {
      errorMessage = "Wrong username or password";
    } else {
      errorMessage = error.message;
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Logo />
      <p className="text-lg">Login</p>
      <p className="text-red-500">{errorMessage}</p>
      <form className="flex flex-col gap-y-2" onSubmit={onSubmit}>
        <div className="flex flex-col gap-y-1">
          <label className="my-auto font-bold">Email</label>
          <Input
            value={formData.email}
            onChange={(e) =>
              setFormData((f) => ({ ...f, email: e.target.value }))
            }
            type="text"
            name="email"
            className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <label className="my-auto font-bold">Password</label>
          <Input
            value={formData.password}
            onChange={(e) =>
              setFormData((f) => ({
                ...f,
                password: e.target.value,
              }))
            }
            type="password"
            name="password"
            className="h-8 flex-1 rounded-lg border border-gray-300 p-2"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Login
        </Button>
      </form>
    </div>
  );
}
