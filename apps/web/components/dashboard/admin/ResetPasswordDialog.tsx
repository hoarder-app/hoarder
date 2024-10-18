import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { api } from "@/lib/trpc"; // Adjust the import path as needed
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { resetPasswordSchema } from "@hoarder/shared/types/users";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
}

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordDialog({
  isOpen,
  onOpenChange,
  userId,
}: ResetPasswordDialogProps) {
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: "",
      newPassword: "",
      newPasswordConfirm: "",
      adminPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const resetPasswordMutation = api.admin.resetPassword.useMutation();

  const handleResetPassword: SubmitHandler<ResetPasswordSchema> = async (
    data,
  ) => {
    setIsLoading(true);
    try {
      await resetPasswordMutation.mutateAsync({ ...data, userId });
      toast({
        description: "Password reset successfully",
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        toast({
          variant: "destructive",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          description: "Failed to reset password",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        userId,
        newPassword: "",
        newPasswordConfirm: "",
        adminPassword: "",
      });
    }
  }, [isOpen, form, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleResetPassword)}>
            <div className="flex w-full flex-col space-y-2">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="New Password"
                        {...field}
                        className="w-full rounded border p-2"
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
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm New Password"
                        {...field}
                        className="w-full rounded border p-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Admin Password"
                        {...field}
                        className="w-full rounded border p-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
                <ActionButton
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Reset
                </ActionButton>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
