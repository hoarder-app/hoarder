import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { Lock } from "lucide-react";

import { api } from "@karakeep/shared-react/trpc";

interface LockedListAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
  onAuthenticated: (password: string) => void;
}

export function LockedListAuthModal({
  open,
  onOpenChange,
  listId,
  listName,
  onAuthenticated,
}: LockedListAuthModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPasswordMutation = api.lists.verifyListPassword.useMutation({
    onSuccess: (data: { valid: boolean }) => {
      if (data.valid) {
        toast({
          description: "Password verified successfully",
        });
        onAuthenticated(password);
        onOpenChange(false);
        setPassword("");
      } else {
        toast({
          variant: "destructive",
          description: "Invalid password",
        });
      }
      setIsVerifying(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: t("common.something_went_wrong"),
      });
      setIsVerifying(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        variant: "destructive",
        description: "Password is required",
      });
      return;
    }

    setIsVerifying(true);
    verifyPasswordMutation.mutate({
      listId,
      password,
    });
  };

  const handleClose = () => {
    setPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Authenticate Locked List
          </DialogTitle>
          <DialogDescription>
            Enter password to access &quot;{listName}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
