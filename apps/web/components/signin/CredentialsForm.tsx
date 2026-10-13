"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn, signInWithPasskey } from "@/lib/auth/client";
import { useClientConfig } from "@/lib/clientConfig";
import { useTranslation } from "@/lib/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import TwoFactorForm from "./TwoFactorForm";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SIGNIN_FAILED = "Incorrect email or password";
const OAUTH_FAILED = "OAuth login failed: ";

export default function CredentialsForm() {
  const [signinError, setSigninError] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientConfig = useClientConfig();
  const { t } = useTranslation();

  const oAuthError = searchParams.get("error");
  if (oAuthError && !signinError) {
    setSigninError(`${OAUTH_FAILED} ${oAuthError}`);
  }

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (twoFactorRequired) {
    return <TwoFactorForm />;
  }

  if (clientConfig.auth.disablePasswordAuth) {
    return (
      <div className="space-y-4">
        {signinError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{signinError}</AlertTitle>
          </Alert>
        )}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>
            Password authentication is currently disabled.
          </AlertTitle>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          // POST so a submit before hydration doesn't put the password in the URL.
          method="post"
          onSubmit={form.handleSubmit(async (value) => {
            const resp = await signIn("credentials", {
              email: value.email.trim(),
              password: value.password,
            });
            if (resp.twoFactorRedirect) {
              setTwoFactorRequired(true);
              return;
            }
            if (!resp.ok) {
              if (resp.code === "INVALID_EMAIL_OR_PASSWORD") {
                setSigninError(SIGNIN_FAILED);
              } else if (resp.code === "EMAIL_NOT_VERIFIED") {
                router.replace(
                  `/check-email?email=${encodeURIComponent(value.email.trim())}`,
                );
              } else {
                setSigninError(resp.error ?? SIGNIN_FAILED);
              }
              return;
            }
            router.replace("/");
          })}
          className="space-y-4"
        >
          {signinError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{signinError}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ActionButton
            ignoreDemoMode
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            Sign In
          </ActionButton>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </Form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async () => {
          setSigninError("");
          const resp = await signInWithPasskey();
          if (!resp.ok) {
            setSigninError(resp.error ?? t("signin.passkey_failed"));
            return;
          }
          router.replace("/");
          router.refresh();
        }}
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {t("signin.sign_in_with_passkey")}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
