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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { changeRoleSchema } from "@karakeep/shared/types/admin";

type ChangeRoleSchema = z.infer<typeof changeRoleSchema>;

interface ChangeRoleDialogProps {
  userId: string;
  currentRole: "user" | "admin";
  children?: React.ReactNode;
}

export default function ChangeRoleDialog({
  userId,
  currentRole,
  children,
}: ChangeRoleDialogProps) {
  const apiUtils = api.useUtils();
  const [isOpen, onOpenChange] = useState(false);
  const form = useForm<ChangeRoleSchema>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: {
      userId,
      role: currentRole,
    },
  });
  const { mutate, isPending } = api.admin.changeRole.useMutation({
    onSuccess: () => {
      toast({
        description: "Role changed successfully",
      });
      apiUtils.users.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTrigger asChild></DialogTrigger>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((val) => mutate(val))}>
            <div className="flex w-full flex-col space-y-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input type="hidden" {...field} />
                    </FormControl>
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
                  loading={isPending}
                  disabled={isPending}
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
