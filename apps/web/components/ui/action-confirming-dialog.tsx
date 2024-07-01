import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "./button";

export default function ActionConfirmingDialog({
  title,
  description,
  actionButton,
  children,
  open: userIsOpen,
  setOpen: userSetOpen,
}: {
  open?: boolean;
  setOpen?: (v: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  actionButton: (setDialogOpen: (open: boolean) => void) => React.ReactNode;
  children?: React.ReactNode;
}) {
  const [customIsOpen, setCustomIsOpen] = useState(false);
  const [isDialogOpen, setDialogOpen] = [
    userIsOpen ?? customIsOpen,
    userSetOpen ?? setCustomIsOpen,
  ];
  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description}
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          {actionButton(setDialogOpen)}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
