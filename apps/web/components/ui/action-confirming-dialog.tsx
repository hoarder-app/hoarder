"use client";

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
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  actionButton: (setDialogOpen: (open: boolean) => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
