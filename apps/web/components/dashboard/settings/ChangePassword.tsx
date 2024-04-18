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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { zChangePasswordSchema } from "@hoarder/shared/types/users";

export function ChangePassword() {
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
      if (e.data?.code == "UNAUTHORIZED") {
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

  return (
    <div className="w-full pt-4">
      <span className="text-xl">Change Password</span>
      <Separator className="my-2" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2 pt-4 lg:w-1/2"
        >
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
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => {
              return (
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
              );
            }}
          />
          <FormField
            control={form.control}
            name="newPasswordConfirm"
            render={({ field }) => {
              return (
                <FormItem className="flex-1">
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="Password"
                      placeholder="Confirm New Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <ActionButton
            className="h-full"
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
