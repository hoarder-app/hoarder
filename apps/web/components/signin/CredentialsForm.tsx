"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientConfig } from "@/lib/clientConfig";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { zSignUpSchema } from "@karakeep/shared/types/users";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SIGNIN_FAILED = "Incorrect username or password";
const OAUTH_FAILED = "OAuth login failed: ";

function SignIn() {
  const [signinError, setSigninError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientConfig = useClientConfig();

  const oAuthError = searchParams.get("error");
  if (oAuthError && !signinError) {
    setSigninError(`${OAUTH_FAILED} ${oAuthError}`);
  }

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
  });

  if (clientConfig.auth.disablePasswordAuth) {
    return (
      <>
        {signinError && (
          <p className="w-full text-center text-destructive">{signinError}</p>
        )}
        <p className="text-center">
          Password authentication is currently disabled.
        </p>
      </>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (value) => {
          const resp = await signIn("credentials", {
            redirect: false,
            email: value.email.trim(),
            password: value.password,
          });
          if (!resp || !resp?.ok) {
            setSigninError(SIGNIN_FAILED);
            return;
          }
          router.replace("/");
        })}
      >
        <div className="flex w-full flex-col space-y-2">
          {signinError && (
            <p className="w-full text-center text-destructive">{signinError}</p>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <ActionButton
            ignoreDemoMode
            type="submit"
            loading={form.formState.isSubmitting}
          >
            Sign In
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

function SignUp() {
  const form = useForm<z.infer<typeof zSignUpSchema>>({
    resolver: zodResolver(zSignUpSchema),
  });
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const createUserMutation = api.users.create.useMutation();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (value) => {
          try {
            await createUserMutation.mutateAsync(value);
          } catch (e) {
            if (e instanceof TRPCClientError) {
              setErrorMessage(e.message);
            }
            return;
          }
          const resp = await signIn("credentials", {
            redirect: false,
            email: value.email.trim(),
            password: value.password,
          });
          if (!resp || !resp.ok) {
            setErrorMessage("Hit an unexpected error while signing in");
            return;
          }
          router.replace("/");
        })}
      >
        <div className="flex w-full flex-col space-y-2">
          {errorMessage && (
            <p className="w-full text-center text-destructive">
              {errorMessage}
            </p>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <ActionButton type="submit" loading={form.formState.isSubmitting}>
            Sign Up
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default function CredentialsForm() {
  const clientConfig = useClientConfig();

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <SignIn />
      </TabsContent>
      <TabsContent value="signup">
        {clientConfig.auth.disableSignups ||
        clientConfig.auth.disablePasswordAuth ? (
          <p className="text-center">Signups are currently disabled.</p>
        ) : (
          <SignUp />
        )}
      </TabsContent>
    </Tabs>
  );
}
