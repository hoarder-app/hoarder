"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { verifyBackupCode, verifyTotp } from "@/lib/auth/client";
import { useTranslation } from "@/lib/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const codeSchema = z.object({
  code: z.string().min(1),
});

// Shown after a password is accepted for an account with a second factor
// enrolled. The two-factor cookie set by the sign-in call authorizes the
// challenge, so no credentials are needed here.
export default function TwoFactorForm() {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {useBackupCode
            ? t("signin.two_factor_backup_prompt")
            : t("signin.two_factor_code_prompt")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (value) => {
            setError("");
            const resp = useBackupCode
              ? await verifyBackupCode(value.code.trim())
              : await verifyTotp(value.code.trim());
            if (!resp.ok) {
              setError(resp.error ?? t("signin.two_factor_invalid_code"));
              form.setValue("code", "");
              return;
            }
            // The session cookie is set by the verification call; a full reload
            // makes sure every client picks it up.
            router.replace("/");
            router.refresh();
          })}
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {useBackupCode
                    ? t("signin.two_factor_backup_label")
                    : t("signin.two_factor_code_label")}
                </FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder={
                      useBackupCode
                        ? t("signin.two_factor_backup_placeholder")
                        : t("signin.two_factor_code_placeholder")
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ActionButton
            ignoreDemoMode
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            {t("signin.two_factor_verify")}
          </ActionButton>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode((v) => !v);
                setError("");
                form.setValue("code", "");
              }}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              {useBackupCode
                ? t("signin.two_factor_use_authenticator")
                : t("signin.two_factor_use_backup")}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
