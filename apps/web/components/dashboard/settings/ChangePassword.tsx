"use client";

import type { z } from "zod";
import { useEffect, useState } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";

import { zChangePasswordSchema } from "@hoarder/shared/types/users";

export function ChangePassword() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<z.infer<typeof zChangePasswordSchema>>({
    resolver: zodResolver(zChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  const mutator = api.users.changePassword.useMutation({
    onSuccess: () => {
      toast({ description: "Password changed successfully" });
      form.reset();
    },
    onError: (e) => {
      if (e.data?.code === "UNAUTHORIZED") {
        toast({
          description: "Your current password is incorrect",
          variant: "destructive",
        });
      } else {
        toast({ description: "Something went wrong", variant: "destructive" });
      }
    },
  });

  async function onSubmit(value: z.infer<typeof zChangePasswordSchema>) {
    mutator.mutate({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    });
  }

  if (!mounted) {
    return null; // or a loading spinner, placeholder, etc.
  }

  return (
    <div
      className={`flex flex-col rounded-lg p-6 sm:flex-row ${
        resolvedTheme === "dark"
          ? "bg-gray-900 bg-opacity-70 text-white"
          : "bg-white bg-opacity-70 text-gray-900"
      } backdrop-blur-lg backdrop-filter`}
    >
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        Change Password
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Current Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="New Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPasswordConfirm"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ActionButton
            className="mt-4 h-10 w-max px-8 text-orange-500"
            type="submit"
            loading={mutator.isPending}
          >
            Save
          </ActionButton>
        </form>
      </Form>
    </div>
  );
}
