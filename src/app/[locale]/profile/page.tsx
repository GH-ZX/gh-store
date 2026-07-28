"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Save,
  Camera,
  Shield,
  Calendar,
  Globe,
  CreditCard,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingPage } from "@/components/shared/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";

export default function ProfilePage() {
  const router = useRouter();
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const supabase = supabaseRef.current;
  const {
    user,
    profile,
    isAuthenticated,
    isLoading,
    signOut,
    updateProfile,
    isSigningOut,
    isUpdatingProfile,
    updateProfileError,
  } = useAuth();
  const { t, locale, isRtl } = useTranslations("auth");

  // ─── Edit Profile State ─────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ─── Change Password State ──────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync form fields when profile data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // ─── Handlers ──────────────────────────────────────

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(false);

    try {
      await updateProfile({ full_name: fullName, phone: phone || null });
      setEditSuccess(true);
      setIsEditing(false);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(isRtl ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        isRtl
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      // First re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError(isRtl ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect");
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : isRtl
            ? "فشل تغيير كلمة المرور"
            : "Failed to change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  // ─── Loading State ─────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="space-y-6">
            <div className="bg-muted h-48 animate-pulse rounded-2xl" />
            <div className="bg-muted h-64 animate-pulse rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  // ─── Not Authenticated ─────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 py-12">
          <EmptyState
            icon={<User className="size-8" />}
            title={isRtl ? "يرجى تسجيل الدخول" : "Please Sign In"}
            titleAr="يرجى تسجيل الدخول"
            description={
              isRtl
                ? "يجب تسجيل الدخول لعرض الملف الشخصي"
                : "You need to sign in to view your profile"
            }
            descriptionAr="يجب تسجيل الدخول لعرض الملف الشخصي"
            action={{
              label: isRtl ? "تسجيل الدخول" : "Sign In",
              labelAr: "تسجيل الدخول",
              onClick: () => router.push(`/${locale}/auth/login`),
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* ─── Page Header ──────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isRtl ? "الملف الشخصي" : "My Profile"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRtl
              ? "إدارة معلومات حسابك وإعداداتك"
              : "Manage your account information and settings"}
          </p>
        </div>

        {/* ─── Profile Summary Card ─────────────────── */}
        <Card className="mb-8 overflow-hidden">
          <div className="from-primary/10 via-primary/5 to-background bg-gradient-to-r p-6 md:p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="size-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="size-8" />
                  )}
                </div>
                <button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full shadow-sm transition-colors"
                  onClick={() => {
                    // Avatar upload placeholder
                  }}
                  title={isRtl ? "تغيير الصورة" : "Change photo"}
                >
                  <Camera className="size-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold">
                  {profile?.full_name || (isRtl ? "مستخدم" : "User")}
                </h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                {profile?.phone && (
                  <p className="text-muted-foreground mt-0.5 text-sm">{profile.phone}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    <Shield className="size-3" />
                    {profile?.role === "admin"
                      ? isRtl
                        ? "مدير"
                        : "Admin"
                      : isRtl
                        ? "عميل"
                        : "Customer"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {isRtl ? "عضو منذ" : "Member since"}{" "}
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { month: "short", year: "numeric" },
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Tabs ─────────────────────────────────── */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="details" className="gap-2">
              <User className="size-4" />
              {isRtl ? "المعلومات" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="size-4" />
              {isRtl ? "الأمان" : "Security"}
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB: DETAILS ══════════════════════════ */}
          <TabsContent value="details" className="space-y-6">
            {/* Edit Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRtl ? "المعلومات الشخصية" : "Personal Information"}
                </CardTitle>
                <CardDescription>
                  {isRtl ? "قم بتحديث اسمك ورقم هاتفك" : "Update your name and phone number"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editSuccess && (
                  <Alert className="mb-4 border-green-500 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      {isRtl ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully"}
                    </AlertDescription>
                  </Alert>
                )}

                {updateProfileError && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {updateProfileError instanceof Error
                        ? updateProfileError.message
                        : isRtl
                          ? "فشل التحديث"
                          : "Update failed"}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleEditProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isRtl ? "اسمك الكامل" : "Your full name"}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input id="email" value={user.email || ""} disabled className="bg-muted/50" />
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? "البريد الإلكتروني لا يمكن تغييره" : "Email cannot be changed"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isRtl ? "رقم الهاتف (اختياري)" : "Phone number (optional)"}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                  </div>

                  <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                    {isEditing ? (
                      <>
                        <Button type="submit" disabled={isUpdatingProfile}>
                          {isUpdatingProfile ? (
                            <>
                              <Loader2
                                className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`}
                              />
                              {isRtl ? "جاري الحفظ..." : "Saving..."}
                            </>
                          ) : (
                            <>
                              <Save className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                              {isRtl ? "حفظ التغييرات" : "Save Changes"}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFullName(profile?.full_name || "");
                            setPhone(profile?.phone || "");
                          }}
                        >
                          {isRtl ? "إلغاء" : "Cancel"}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        {isRtl ? "تعديل المعلومات" : "Edit Information"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRtl ? "معلومات الحساب" : "Account Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`flex items-center justify-between py-2 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm">{isRtl ? "البريد الإلكتروني" : "Email"}</span>
                  </div>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <Separator />
                <div
                  className={`flex items-center justify-between py-2 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm">{isRtl ? "تاريخ التسجيل" : "Registered"}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US",
                          { year: "numeric", month: "long", day: "numeric" },
                        )
                      : "-"}
                  </span>
                </div>
                <Separator />
                <div
                  className={`flex items-center justify-between py-2 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm">{isRtl ? "الدور" : "Role"}</span>
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {profile?.role || "customer"}
                  </span>
                </div>
                <Separator />
                <div
                  className={`flex items-center justify-between py-2 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm">{isRtl ? "اللغة" : "Language"}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {locale === "ar" ? "العربية" : "English"}
                  </span>
                </div>
                <Separator />
                <div
                  className={`flex items-center justify-between py-2 ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-muted-foreground size-4 shrink-0" />
                    <span className="text-sm">{isRtl ? "العملة" : "Currency"}</span>
                  </div>
                  <span className="text-sm font-medium">USD</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB: SECURITY ═════════════════════════ */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRtl ? "تغيير كلمة المرور" : "Change Password"}
                </CardTitle>
                <CardDescription>
                  {isRtl
                    ? "أدخل كلمة المرور الحالية ثم الجديدة"
                    : "Enter your current password and a new one"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <Alert className="mb-4 border-green-500 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      {isRtl ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"}
                    </AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      {isRtl ? "كلمة المرور الحالية" : "Current Password"}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={isRtl ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isRtl ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {isRtl ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        isRtl ? "أعد إدخال كلمة المرور الجديدة" : "Re-enter new password"
                      }
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`} />
                        {isRtl ? "جاري التغيير..." : "Changing..."}
                      </>
                    ) : (
                      <>
                        <KeyRound className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                        {isRtl ? "تغيير كلمة المرور" : "Change Password"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isRtl ? "روابط سريعة" : "Quick Links"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href={`/${locale}/orders`}
                  className={`hover:bg-muted flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <span className="bg-primary size-2 rounded-full" />
                  {isRtl ? "عرض طلباتي" : "View My Orders"}
                </Link>
                <Link
                  href={`/${locale}/wallet`}
                  className={`hover:bg-muted flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
                >
                  <span className="bg-primary size-2 rounded-full" />
                  {isRtl ? "المحفظة ورصيدي" : "Wallet & Balance"}
                </Link>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full max-w-xs gap-2"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isRtl ? "تسجيل الخروج" : "Sign Out"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
