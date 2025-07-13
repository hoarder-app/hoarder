"use client";

import { ActionButton } from "@/components/ui/action-button";
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
import { formatDistanceToNow } from "date-fns";
import { Mail, MailX, UserPlus } from "lucide-react";

import ActionConfirmingDialog from "../ui/action-confirming-dialog";
import CreateInviteDialog from "./CreateInviteDialog";

export default function InvitesList() {
  const invalidateInvitesList = api.useUtils().invites.list.invalidate;
  const { data: invites, isLoading } = api.invites.list.useQuery();

  const { mutateAsync: revokeInvite, isPending: isRevokePending } =
    api.invites.revoke.useMutation({
      onSuccess: () => {
        toast({
          description: "Invite revoked successfully",
        });
        invalidateInvitesList();
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Failed to revoke invite: ${e.message}`,
        });
      },
    });

  const { mutateAsync: resendInvite, isPending: isResendPending } =
    api.invites.resend.useMutation({
      onSuccess: () => {
        toast({
          description: "Invite resent successfully",
        });
        invalidateInvitesList();
      },
      onError: (e) => {
        toast({
          variant: "destructive",
          description: `Failed to resend invite: ${e.message}`,
        });
      },
    });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const activeInvites =
    invites?.invites?.filter(
      (invite) => new Date(invite.expiresAt) > new Date(),
    ) || [];

  const expiredInvites =
    invites?.invites?.filter(
      (invite) => new Date(invite.expiresAt) <= new Date(),
    ) || [];

  const getStatusBadge = (
    invite: NonNullable<typeof invites>["invites"][0],
  ) => {
    if (new Date(invite.expiresAt) <= new Date()) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
          Expired
        </span>
      );
    }
    return (
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
        Active
      </span>
    );
  };

  const InviteTable = ({
    invites: inviteList,
    title,
  }: {
    invites: NonNullable<typeof invites>["invites"];
    title: string;
  }) => (
    <div className="mb-6">
      <h3 className="mb-3 text-lg font-medium">
        {title} ({inviteList.length})
      </h3>
      {inviteList.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {title.toLowerCase()} invites
        </p>
      ) : (
        <Table>
          <TableHeader className="bg-gray-200">
            <TableHead>Email</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {inviteList.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="py-2">{invite.email}</TableCell>
                <TableCell className="py-2">{invite.invitedBy.name}</TableCell>
                <TableCell className="py-2">
                  {formatDistanceToNow(new Date(invite.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="py-2">
                  {formatDistanceToNow(new Date(invite.expiresAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="py-2">{getStatusBadge(invite)}</TableCell>
                <TableCell className="flex gap-1 py-2">
                  {new Date(invite.expiresAt) > new Date() && (
                    <>
                      <ButtonWithTooltip
                        tooltip="Resend Invite"
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvite({ inviteId: invite.id })}
                        disabled={isResendPending}
                      >
                        <Mail size={14} />
                      </ButtonWithTooltip>
                      <ActionConfirmingDialog
                        title="Revoke Invite"
                        description={`Are you sure you want to revoke the invite for ${invite.email}? This action cannot be undone.`}
                        actionButton={(setDialogOpen) => (
                          <ActionButton
                            variant="destructive"
                            loading={isRevokePending}
                            onClick={async () => {
                              await revokeInvite({ inviteId: invite.id });
                              setDialogOpen(false);
                            }}
                          >
                            Revoke
                          </ActionButton>
                        )}
                      >
                        <ButtonWithTooltip
                          tooltip="Revoke Invite"
                          variant="outline"
                          size="sm"
                        >
                          <MailX size={14} color="red" />
                        </ButtonWithTooltip>
                      </ActionConfirmingDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex items-center justify-between text-xl font-medium">
        <span>User Invitations</span>
        <CreateInviteDialog>
          <ButtonWithTooltip tooltip="Send Invite" variant="outline">
            <UserPlus size={16} />
          </ButtonWithTooltip>
        </CreateInviteDialog>
      </div>

      <InviteTable invites={activeInvites} title="Active Invites" />
      <InviteTable invites={expiredInvites} title="Expired Invites" />
    </div>
  );
}
