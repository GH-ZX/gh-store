import { createSupabaseServerClient , createSupabaseAdminClient } from "@/lib/utils/supabase";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Server-side authentication service.
 * All functions run exclusively on the server (Server Components / Server Actions).
 */
export class AuthService {
  /**
   * Sign up a new user with email and password.
   * The `handle_new_user` trigger automatically creates the profile + wallet.
   */
  static async signUp(params: { email: string; password: string; fullName?: string }) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName ?? null,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email and password.
   */
  static async signIn(params: { email: string; password: string }) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out the current user.
   */
  static async signOut() {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get the currently authenticated user.
   * Returns null if no session exists.
   */
  static async getUser() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  }

  /**
   * Get the user's profile.
   * Returns null if no session exists or profile is not found.
   */
  static async getProfile(): Promise<Profile | null> {
    const user = await this.getUser();
    if (!user) return null;

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Get the current session.
   */
  static async getSession() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  }

  /**
   * Update the user's profile.
   */
  static async updateProfile(updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>) {
    const user = await this.requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Send a password reset email.
   */
  static async sendPasswordResetEmail(email: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
    // Note: locale prefix is added by the caller when needed
    });

    if (error) throw error;
  }

  /**
   * Update the user's password.
   */
  static async updatePassword(newPassword: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  // ─── Guards ───────────────────────────────────────────

  /**
   * Require the user to be authenticated.
   * Throws an error if not authenticated.
   */
  static async requireAuth() {
    const user = await this.getUser();
    if (!user) throw new Error("Authentication required");
    return user;
  }

  /**
   * Require the user to be an admin.
   * Throws an error if not authenticated or not an admin.
   */
  static async requireAdmin() {
    const user = await this.requireAuth();
    const profile = await this.getProfile();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    return { user, profile };
  }

  /**
   * Check if the current user is an admin.
   * Returns false instead of throwing.
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile?.role === "admin";
    } catch {
      return false;
    }
  }

  // ─── Admin Operations ─────────────────────────────────

  /**
   * Get a profile by ID (admin only).
   */
  static async getProfileById(profileId: string) {
    await this.requireAdmin();
    const adminClient = createSupabaseAdminClient();

    const { data, error } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * List all profiles (admin only).
   */
  static async listProfiles(options?: { page?: number; limit?: number; role?: string }) {
    await this.requireAdmin();
    const adminClient = createSupabaseAdminClient();

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = adminClient
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (options?.role) {
      query = query.eq("role", options.role);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { profiles: data, count: count ?? 0 };
  }
}
