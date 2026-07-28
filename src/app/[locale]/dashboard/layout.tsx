import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/utils/supabase";
import { DashboardShell } from "./dashboard-shell";

/**
 * Admin Dashboard Layout (Server Component).
 *
 * Enforces the admin role server-side. `src/proxy.ts` also gates `/dashboard`,
 * but relying on it alone is a single point of failure — and its matcher
 * excludes `/api/*` entirely, so the data behind this UI needs its own guards
 * regardless (see `src/lib/utils/api-auth.ts`).
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/${locale}/dashboard`);
  }

  // Anon-key client, so this SELECT is subject to RLS — as intended.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${locale}`);
  }

  return <DashboardShell>{children}</DashboardShell>;
}
