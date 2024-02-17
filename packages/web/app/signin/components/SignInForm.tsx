import { getProviders } from "next-auth/react";
import SignInProviderButton from "./SignInProviderButton";

export default async function SignInForm() {
  const providers = (await getProviders()) ?? [];

  return (
    <div>
      {Object.values(providers).map((provider) => (
        <div key={provider.name}>
          <SignInProviderButton provider={provider} />
        </div>
      ))}
    </div>
  );
}
