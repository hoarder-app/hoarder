"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import {
  disableTwoFactor,
  enableTwoFactor,
  generateBackupCodes,
  verifyTotp,
} from "@/lib/auth/client";
import { useTranslation } from "@/lib/i18n/client";
import { AlertCircle, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code";

import { SettingsSection } from "./SettingsPage";

export default function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // otpauth:// URIs parse fine as URLs, so the manual-entry secret is a query
  // param.
  const secret = totpURI ? new URL(totpURI).searchParams.get("secret") : null;

  function resetSensitiveState() {
    setPassword("");
    setCode("");
    setError("");
  }

  async function startEnrollment() {
    setBusy(true);
    setError("");
    const resp = await enableTwoFactor(password || undefined);
    setBusy(false);
    if (!resp.ok || !resp.setup) {
      setError(resp.error ?? t("settings.two_factor.start_error"));
      return;
    }
    setTotpURI(resp.setup.totpURI);
    setBackupCodes(resp.setup.backupCodes);
  }

  async function confirmEnrollment() {
    setBusy(true);
    setError("");
    const resp = await verifyTotp(code.trim());
    setBusy(false);
    if (!resp.ok) {
      setError(resp.error ?? t("settings.two_factor.invalid_code"));
      return;
    }
    setIsEnabled(true);
    setTotpURI(null);
    resetSensitiveState();
    toast({ description: t("settings.two_factor.enabled_toast") });
    router.refresh();
  }

  async function disable() {
    setBusy(true);
    setError("");
    const resp = await disableTwoFactor(password || undefined);
    setBusy(false);
    if (!resp.ok) {
      setError(resp.error ?? t("settings.two_factor.disable_error"));
      return;
    }
    setIsEnabled(false);
    setBackupCodes(null);
    resetSensitiveState();
    toast({ description: t("settings.two_factor.disabled_toast") });
    router.refresh();
  }

  async function regenerateBackupCodes() {
    setBusy(true);
    setError("");
    const resp = await generateBackupCodes(password || undefined);
    setBusy(false);
    if (!resp.ok || !resp.backupCodes) {
      setError(resp.error ?? t("settings.two_factor.regenerate_error"));
      return;
    }
    setBackupCodes(resp.backupCodes);
  }

  return (
    <SettingsSection id="two-factor" title={t("settings.two_factor.title")}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {isEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>{t("settings.two_factor.enabled")}</span>
          </div>

          {(backupCodes ?? []).length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">
                {t("settings.two_factor.backup_codes_saved")}
              </p>
              <div className="flex flex-wrap gap-2">
                {backupCodes!.map((c) => (
                  <Badge key={c} variant="outline" className="font-mono">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-sm space-y-2">
            <Label htmlFor="two-factor-password">
              {t("settings.two_factor.password")}
            </Label>
            <Input
              id="two-factor-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("settings.two_factor.confirm_password")}
              className="h-11"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <ActionButton
              type="button"
              variant="outline"
              loading={busy}
              onClick={regenerateBackupCodes}
            >
              {t("settings.two_factor.regenerate_backup_codes")}
            </ActionButton>
            <ActionButton
              type="button"
              variant="destructive"
              loading={busy}
              onClick={disable}
            >
              {t("settings.two_factor.disable")}
            </ActionButton>
          </div>
        </div>
      ) : totpURI ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.two_factor.scan_qr")}
          </p>

          <div className="flex justify-center rounded-md bg-white p-4">
            <QRCode value={totpURI} size={176} />
          </div>

          {secret && (
            <p className="text-center text-sm text-muted-foreground">
              {t("settings.two_factor.manual_key")}{" "}
              <span className="font-mono">{secret}</span>
            </p>
          )}

          {backupCodes && backupCodes.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">
                {t("settings.two_factor.backup_codes_new")}
              </p>
              <div className="flex flex-wrap gap-2">
                {backupCodes.map((c) => (
                  <Badge key={c} variant="outline" className="font-mono">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-sm space-y-2">
            <Label htmlFor="two-factor-code">
              {t("settings.two_factor.authentication_code")}
            </Label>
            <Input
              id="two-factor-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="h-11"
            />
          </div>

          <div className="flex justify-end gap-2">
            <ActionButton
              type="button"
              variant="outline"
              loading={false}
              disabled={busy}
              onClick={() => {
                setTotpURI(null);
                resetSensitiveState();
              }}
            >
              {t("settings.two_factor.cancel")}
            </ActionButton>
            <ActionButton
              type="button"
              loading={busy}
              disabled={!code.trim()}
              onClick={confirmEnrollment}
            >
              {t("settings.two_factor.verify_and_enable")}
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.two_factor.description")}
          </p>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="two-factor-password-start">
              {t("settings.two_factor.password")}
            </Label>
            <Input
              id="two-factor-password-start"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("settings.two_factor.confirm_password")}
              className="h-11"
            />
          </div>
          <div className="flex justify-end">
            <ActionButton
              type="button"
              loading={busy}
              onClick={startEnrollment}
            >
              {t("settings.two_factor.enable")}
            </ActionButton>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
