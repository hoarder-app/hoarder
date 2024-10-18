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

import { changeRoleSchema } from "@hoarder/shared/types/users";

type ChangeRoleSchema = z.infer<typeof changeRoleSchema>;

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  currentRole: "user" | "admin";
  onRoleChanged: () => void;
}

export default function ChangeRoleDialog({
  isOpen,
  onOpenChange,
  userId,
  currentRole,
  onRoleChanged,
}: ChangeRoleDialogProps) {
  console.log(currentRole);
  const form = useForm<ChangeRoleSchema>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      userId: "",
      role: currentRole,
      adminPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const changeRoleMutation = api.admin.changeRole.useMutation();

  const handleChangeRole: SubmitHandler<ChangeRoleSchema> = async (data) => {
    setIsLoading(true);
    try {
      await changeRoleMutation.mutateAsync({ ...data, userId });
      toast({
        description: "Role changed successfully",
      });
      onOpenChange(false);
      onRoleChanged();
    } catch (error) {
      if (error instanceof TRPCClientError) {
        toast({
          variant: "destructive",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          description: "Failed to change role",
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
        role: currentRole,
        adminPassword: "",
      });
    }
  }, [isOpen, form, userId, currentRole]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleChangeRole)}>
            <div className="flex w-full flex-col space-y-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded border p-2">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
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
                  Change
                </ActionButton>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
