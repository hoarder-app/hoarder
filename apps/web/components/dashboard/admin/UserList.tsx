"use client";

import { ActionButtonWithTooltip } from "@/components/ui/action-button";
import { ButtonWithTooltip } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { Check, KeyRound, Pencil, Trash, UserPlus, X } from "lucide-react";
import { useSession } from "next-auth/react";

import AddUserDialog from "./AddUserDialog";
import ChangeRoleDialog from "./ChangeRoleDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";

function toHumanReadableSize(size: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (size === 0) return "0 Bytes";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

export default function UsersSection() {
  const { data: session } = useSession();
  const invalidateUserList = api.useUtils().users.list.invalidate;
  const { data: users } = api.users.list.useQuery();
  const { data: userStats } = api.admin.userStats.useQuery();
  const { mutate: deleteUser, isPending: isDeletionPending } =
    api.users.delete.useMutation({
      onSuccess: () => {
        toast({
          description: "User deleted",
        });
        invalidateUserList();
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Something went wrong: ${e.message}`,
        });
      },
    });

  if (!users || !userStats) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xl font-medium">
        <span>Users List</span>
        <AddUserDialog>
          <ButtonWithTooltip tooltip="Create User" variant="outline">
            <UserPlus size={16} />
          </ButtonWithTooltip>
        </AddUserDialog>
      </div>

      <Table>
        <TableHeader className="bg-gray-200">
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Num Bookmarks</TableHead>
          <TableHead>Asset Sizes</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Local User</TableHead>
          <TableHead>Actions</TableHead>
        </TableHeader>
        <TableBody>
          {users.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="py-1">{u.name}</TableCell>
              <TableCell className="py-1">{u.email}</TableCell>
              <TableCell className="py-1">
                {userStats[u.id].numBookmarks}
              </TableCell>
              <TableCell className="py-1">
                {toHumanReadableSize(userStats[u.id].assetSizes)}
              </TableCell>
              <TableCell className="py-1 capitalize">{u.role}</TableCell>
              <TableCell className="py-1 capitalize">
                {u.localUser ? <Check /> : <X />}
              </TableCell>
              <TableCell className="flex gap-1 py-1">
                <ActionButtonWithTooltip
                  tooltip="Delete user"
                  variant="outline"
                  onClick={() => deleteUser({ userId: u.id })}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id}
                >
                  <Trash size={16} color="red" />
                </ActionButtonWithTooltip>
                <ResetPasswordDialog userId={u.id}>
                  <ButtonWithTooltip
                    tooltip="Reset password"
                    variant="outline"
                    disabled={session!.user.id == u.id || !u.localUser}
                  >
                    <KeyRound size={16} color="red" />
                  </ButtonWithTooltip>
                </ResetPasswordDialog>
                <ChangeRoleDialog userId={u.id} currentRole={u.role!}>
                  <ButtonWithTooltip
                    tooltip="Change role"
                    variant="outline"
                    disabled={session!.user.id == u.id}
                  >
                    <Pencil size={16} color="red" />
                  </ButtonWithTooltip>
                </ChangeRoleDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
