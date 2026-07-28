"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * React hook for authentication state and actions.
 *
 * Uses TanStack Query to cache user + profile data.
 * Automatically invalidates on sign-in/out.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // ─── Queries ──────────────────────────────────────────

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery<User | null>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    },
    staleTime: 300_000, // 5 minutes
  });

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<Profile | null>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error || !data) return null;
      return data as Profile;
    },
    enabled: !!user,
    staleTime: 300_000,
  });

  // ─── Mutations ────────────────────────────────────────

  const signInMutation = useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword(params);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.refresh();
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (params: { email: string; password: string; fullName?: string }) => {
      const { error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: { full_name: params.fullName ?? null },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all queries and cache
      queryClient.clear();
      router.refresh();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", currentUser.id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });

  // ─── Convenience helpers ──────────────────────────────

  const signIn = useCallback(
    async (params: { email: string; password: string }) => {
      return signInMutation.mutateAsync(params);
    },
    [signInMutation],
  );

  const signUp = useCallback(
    async (params: { email: string; password: string; fullName?: string }) => {
      return signUpMutation.mutateAsync(params);
    },
    [signUpMutation],
  );

  const signOut = useCallback(async () => {
    return signOutMutation.mutateAsync();
  }, [signOutMutation]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>) => {
      return updateProfileMutation.mutateAsync(updates);
    },
    [updateProfileMutation],
  );

  return {
    // State
    user: user ?? null,
    profile: profile ?? null,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "admin",
    isLoading: userLoading || profileLoading,
    error: userError || profileError,

    // Actions
    signIn,
    signUp,
    signOut,
    updateProfile,

    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,
    updateProfileError: updateProfileMutation.error,
  };
}
