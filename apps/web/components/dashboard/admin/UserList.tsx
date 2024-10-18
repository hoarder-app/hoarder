"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
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
  const { data: users, refetch: refetchUsers } = api.users.list.useQuery();
  const { data: userStats, refetch: refetchUserStats } =
    api.admin.userStats.useQuery();
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<
    "user" | "admin" | null
  >(null);

  const refreshUserList = () => {
    invalidateUserList();
    refetchUsers();
    refetchUserStats();
  };

  const handleOpenResetPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  const handleOpenChangeRoleDialog = (
    userId: string,
    role: "user" | "admin",
  ) => {
    setSelectedUserId(userId);
    setSelectedUserRole(role);
    setIsChangeRoleDialogOpen(true);
  };

  if (!users || !userStats) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between text-xl font-medium">
        <span>Users List</span>
        <ActionButton
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          loading={isDeletionPending}
        >
          <UserPlus size={16} />
        </ActionButton>
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
              <TableCell className="py-1">
                <ActionButton
                  variant="outline"
                  onClick={() => deleteUser({ userId: u.id })}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id}
                >
                  <Trash size={16} color="red" />
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => handleOpenResetPasswordDialog(u.id)}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id || !u.localUser}
                >
                  <KeyRound size={16} color="red" />
                </ActionButton>
                <ActionButton
                  variant="outline"
                  onClick={() => handleOpenChangeRoleDialog(u.id, u.role!)}
                  loading={isDeletionPending}
                  disabled={session!.user.id == u.id || !u.localUser}
                >
                  <Pencil size={16} color="red" />
                </ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddUserDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUserAdded={refreshUserList}
      />
      <ResetPasswordDialog
        isOpen={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
        userId={selectedUserId!}
      />
      <ChangeRoleDialog
        isOpen={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
        userId={selectedUserId!}
        currentRole={selectedUserRole!}
        onRoleChanged={refreshUserList}
      />
    </>
  );
}
