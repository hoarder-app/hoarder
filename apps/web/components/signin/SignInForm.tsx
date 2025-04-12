import { getProviders } from "next-auth/react";

import serverConfig from "@karakeep/shared/config";

import CredentialsForm from "./CredentialsForm";
import SignInProviderButton from "./SignInProviderButton";

export default async function SignInForm() {
  const providers = await getProviders();
  let providerValues;
  if (providers) {
    providerValues = Object.values(providers).filter(
      // Credentials are handled manually by the sign in form
      (p) => p.id != "credentials",
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      {serverConfig.demoMode && (
        <div className="mb-1 w-full items-start space-y-1 rounded bg-accent p-3">
          <p className="text-center font-bold">Demo Mode</p>
          <p>Email: {serverConfig.demoMode.email} </p>
          <p>Password: {serverConfig.demoMode.password} </p>
        </div>
      )}
      <CredentialsForm />

      {providerValues && providerValues.length > 0 && (
        <>
          <div className="flex w-full items-center">
            <div className="flex-1 grow border-t-2 border-gray-200"></div>
            <span className="bg-white px-3 text-gray-500">Or</span>
            <div className="flex-1 grow border-t-2 border-gray-200"></div>
          </div>
          <div className="space-y-2">
            {providerValues.map((provider) => (
              <div key={provider.id}>
                <SignInProviderButton provider={provider} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
