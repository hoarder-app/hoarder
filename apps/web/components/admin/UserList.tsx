"use client";

import { memo, useCallback, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { ButtonWithTooltip } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/auth/client";
import { useTranslation } from "@/lib/i18n/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { TFunction } from "i18next";
import { KeyRound, Pencil, Trash, UserPlus } from "lucide-react";
import { z } from "zod";

import { useTRPC } from "@karakeep/shared-react/trpc";
import { zAdminUserSchema } from "@karakeep/shared/types/admin";

import ActionConfirmingDialog from "../ui/action-confirming-dialog";
import AddUserDialog from "./AddUserDialog";
import { AdminCard } from "./AdminCard";
import ResetPasswordDialog from "./ResetPasswordDialog";
import UpdateUserDialog from "./UpdateUserDialog";

function toHumanReadableSize(size: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (size === 0) return "0 Bytes";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

type AdminUser = z.infer<typeof zAdminUserSchema>;
type UserDialog = "delete" | "resetPassword" | "edit";

// Rows are memoized and don't own any dialogs/forms/mutations. With thousands
// of users, mounting those per row makes the page extremely heavy.
const UserRow = memo(function UserRow({
  user: u,
  stats,
  isSelf,
  t,
  openDialog,
}: {
  user: AdminUser;
  stats: { numBookmarks: number; assetSizes: number };
  isSelf: boolean;
  t: TFunction;
  openDialog: (dialog: UserDialog, user: AdminUser) => void;
}) {
  return (
    <TableRow>
      <TableCell className="py-1">{u.name}</TableCell>
      <TableCell className="py-1">{u.email}</TableCell>
      <TableCell className="py-1">
        {stats.numBookmarks} /{" "}
        {u.bookmarkQuota ?? t("admin.users_list.unlimited")}
      </TableCell>
      <TableCell className="py-1">
        {toHumanReadableSize(stats.assetSizes)} /{" "}
        {u.storageQuota
          ? toHumanReadableSize(u.storageQuota)
          : t("admin.users_list.unlimited")}
      </TableCell>
      <TableCell className="py-1">
        {u.role && t(`common.roles.${u.role}`)}
      </TableCell>
      <TableCell className="flex gap-1 py-1">
        <ButtonWithTooltip
          tooltip={t("admin.users_list.delete_user")}
          variant="outline"
          disabled={isSelf}
          onClick={() => openDialog("delete", u)}
        >
          <Trash size={16} color="red" />
        </ButtonWithTooltip>
        <ButtonWithTooltip
          tooltip={t("admin.users_list.reset_password")}
          variant="outline"
          disabled={isSelf}
          onClick={() => openDialog("resetPassword", u)}
        >
          <KeyRound size={16} color="red" />
        </ButtonWithTooltip>
        <ButtonWithTooltip
          tooltip="Edit User"
          variant="outline"
          disabled={isSelf}
          onClick={() => openDialog("edit", u)}
        >
          <Pencil size={16} color="red" />
        </ButtonWithTooltip>
      </TableCell>
    </TableRow>
  );
});

export default function UsersSection() {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const {
    data: { users },
  } = useSuspenseQuery(api.users.list.queryOptions());
  const { data: userStats } = useSuspenseQuery(
    api.admin.userStats.queryOptions(),
  );
  // The selected user is kept around after the dialog closes so that the
  // closing animation still has content to render.
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeDialog, setActiveDialog] = useState<UserDialog | null>(null);
  const openDialog = useCallback((dialog: UserDialog, user: AdminUser) => {
    setSelectedUser(user);
    setActiveDialog(dialog);
  }, []);
  const setDialogOpen = (dialog: UserDialog) => (open: boolean) =>
    setActiveDialog(open ? dialog : null);

  const { mutateAsync: deleteUser, isPending: isDeletionPending } = useMutation(
    api.users.delete.mutationOptions({
      onSuccess: () => {
        toast({
          description: "User deleted",
        });
        queryClient.invalidateQueries(api.users.list.pathFilter());
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Something went wrong: ${e.message}`,
        });
      },
    }),
  );

  return (
    <AdminCard>
      <div className="flex flex-col gap-4">
        <div className="mb-2 flex items-center justify-between text-xl font-medium">
          <span>{t("admin.users_list.users_list")}</span>
          <AddUserDialog>
            <ButtonWithTooltip tooltip="Create User" variant="outline">
              <UserPlus size={16} />
            </ButtonWithTooltip>
          </AddUserDialog>
        </div>

        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.email")}</TableHead>
              <TableHead>{t("admin.users_list.num_bookmarks")}</TableHead>
              <TableHead>{t("admin.users_list.asset_sizes")}</TableHead>
              <TableHead>{t("common.role")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                stats={userStats[u.id]}
                isSelf={session!.user.id == u.id}
                t={t}
                openDialog={openDialog}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedUser && (
        <>
          <ActionConfirmingDialog
            open={activeDialog === "delete"}
            setOpen={setDialogOpen("delete")}
            title={t("admin.users_list.delete_user")}
            description={t("admin.users_list.delete_user_confirm_description", {
              name: selectedUser.name ?? "this user",
            })}
            actionButton={(setOpen) => (
              <ActionButton
                variant="destructive"
                loading={isDeletionPending}
                onClick={async () => {
                  await deleteUser({ userId: selectedUser.id });
                  setOpen(false);
                }}
              >
                Delete
              </ActionButton>
            )}
          />
          <ResetPasswordDialog
            key={`reset-${selectedUser.id}`}
            userId={selectedUser.id}
            open={activeDialog === "resetPassword"}
            setOpen={setDialogOpen("resetPassword")}
          />
          <UpdateUserDialog
            key={`edit-${selectedUser.id}`}
            userId={selectedUser.id}
            currentRole={selectedUser.role!}
            currentQuota={selectedUser.bookmarkQuota}
            currentStorageQuota={selectedUser.storageQuota}
            open={activeDialog === "edit"}
            setOpen={setDialogOpen("edit")}
          />
        </>
      )}
    </AdminCard>
  );
}
