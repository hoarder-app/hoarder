"use client";

import type { z } from "zod";
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
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";

import { zChangeEmailAddressSchema } from "@hoarder/shared/types/users";

export function ChangeEmailAddress() {
  const form = useForm<z.infer<typeof zChangeEmailAddressSchema>>({
    resolver: zodResolver(zChangeEmailAddressSchema),
    defaultValues: {
      newEmailAddress: "",
      currentPassword: "",
    },
  });

  const mutator = api.users.changeEmailAddress.useMutation({
    onSuccess: () => {
      toast({
        description: "Email Address changed successfully. Logging out.",
      });
      form.reset();
      signOut();
    },
    onError: (e) => {
      if (e.data?.code == "UNAUTHORIZED") {
        toast({
          description: "Your current password is incorrect",
          variant: "destructive",
        });
      } else {
        toast({
          description: e.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
  });

  async function onSubmit(value: z.infer<typeof zChangeEmailAddressSchema>) {
    mutator.mutate({
      newEmailAddress: value.newEmailAddress,
      currentPassword: value.currentPassword,
    });
  }

  return (
    <div className="flex flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        Change Email Address
        <br />
        <div className="text-xs">(reauthentication required after change)</div>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="newEmailAddress"
            render={({ field }) => {
              return (
                <FormItem className="flex-1">
                  <FormLabel>New Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter new Email Address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => {
              return (
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
              );
            }}
          />
          <ActionButton
            className="mt-4 h-10 w-max px-8"
            type="submit"
            loading={mutator.isPending}
          >
            Update Email address
          </ActionButton>
        </form>
      </Form>
    </div>
  );
}
