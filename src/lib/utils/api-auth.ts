import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/utils/supabase";

/**
 * Auth guards for API route handlers.
 *
 * Route handlers are NOT covered by `src/proxy.ts` — its matcher excludes
 * `/api/*`. Every handler that touches provider credentials, the service-role
 * client, or another user's data must call one of these guards explicitly.
 *
 * They return a `NextResponse` on failure (rather than throwing like
 * `AuthService.requireAuth`) so handlers can `if (guard.error) return guard.error`.
 */

export type GuardFailure = { error: NextResponse; user?: never; profile?: never };
export type AuthSuccess = { error?: never; user: { id: string; email?: string } };
export type AdminSuccess = AuthSuccess & { profile: { id: string; role: string } };

/**
 * Require an authenticated user. Uses `getUser()` (validates the JWT with
 * Supabase) — never `getSession()`, which trusts a spoofable cookie.
 */
export async function requireApiAuth(): Promise<AuthSuccess | GuardFailure> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  return { user: { id: user.id, email: user.email } };
}

/**
 * Require an authenticated user with the `admin` role.
 *
 * The role lookup deliberately uses the anon-key server client so RLS applies —
 * it must never use the service-role client, which would bypass the very
 * policies that make this check meaningful.
 */
export async function requireApiAdmin(): Promise<AdminSuccess | GuardFailure> {
  const auth = await requireApiAuth();
  if (auth.error) return auth;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", auth.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    // 403, not 404 — the caller is authenticated, just not authorized.
    return {
      error: NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 },
      ),
    };
  }

  return { user: auth.user, profile: { id: profile.id, role: profile.role } };
}
