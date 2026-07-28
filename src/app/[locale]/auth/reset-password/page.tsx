"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Send, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { LoadingPage } from "@/components/shared/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import {
  resetPasswordSchema,
  newPasswordSchema,
  type ResetPasswordFormData,
  type NewPasswordFormData,
} from "@/lib/validation/auth.schema";

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const isRecovery = searchParams.has("code") || searchParams.has("token");
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const { t, locale, isRtl } = useTranslations("auth");

  // ─── Email Step ───────────────────────────────────────

  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const emailForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSendResetLink = async (data: ResetPasswordFormData) => {
    const supabase = supabaseRef.current;
    setIsSending(true);
    setEmailError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=/auth/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : t("password.sent"));
    } finally {
      setIsSending(false);
    }
  };

  // ─── New Password Step ─────────────────────────────────

  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const passwordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  const onSaveNewPassword = async (data: NewPasswordFormData) => {
    const supabase = supabaseRef.current;
    setIsChanging(true);
    setPasswordError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) throw error;
      setPasswordChanged(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t("password.success"));
    } finally {
      setIsChanging(false);
    }
  };

  // ─── Success: Password Changed ─────────────────────────

  if (passwordChanged) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">
              {t("password.new_password_title")}
            </CardTitle>
            <CardDescription className="text-base">{t("password.success")}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href={`/${locale}/auth/login`}>
              <Button>{t("actions.login")}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── Success: Email Sent ───────────────────────────────

  if (emailSent) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">
              {isRtl ? "تحقق من بريدك الإلكتروني" : "Check Your Email"}
            </CardTitle>
            <CardDescription className="text-base">{t("password.sent")}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href={`/${locale}/auth/login`}>
              <Button variant="outline">
                {isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In"}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── New Password Form (recovery mode) ─────────────────

  if (isRecovery) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("password.new_password_title")}</CardTitle>
            <CardDescription>
              {isRtl ? "أدخل كلمة المرور الجديدة" : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onSaveNewPassword)} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">{t("password.new_password_label")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={isRtl ? "أدخل كلمة المرور الجديدة" : "Enter your new password"}
                  autoComplete="new-password"
                  {...passwordForm.register("password")}
                  aria-invalid={!!passwordForm.formState.errors.password}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-destructive text-sm">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">{t("password.confirm_password_label")}</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder={
                    isRtl ? "أعد إدخال كلمة المرور الجديدة" : "Re-enter your new password"
                  }
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isChanging}>
                {isChanging ? (
                  <>
                    <Loader2 className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`} />
                    {isRtl ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Lock className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                    {t("password.save")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Email Form (default) ──────────────────────────────

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t("password.reset_title")}</CardTitle>
          <CardDescription>{t("password.reset_subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onSendResetLink)} className="space-y-4">
            {emailError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("password.email_label")}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t("password.email_placeholder")}
                autoComplete="email"
                {...emailForm.register("email")}
                aria-invalid={!!emailForm.formState.errors.email}
              />
              {emailForm.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`} />
                  {isRtl ? "جاري الإرسال..." : "Sending..."}
                </>
              ) : (
                <>
                  <Send className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                  {t("password.submit")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href={`/${locale}/auth/login`} className="text-primary text-sm hover:underline">
            {isRtl ? "العودة لتسجيل الدخول" : "Back to Sign In"}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
