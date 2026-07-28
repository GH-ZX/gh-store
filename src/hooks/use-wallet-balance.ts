"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import { useAuth } from "./use-auth";

interface WalletBalance {
  balance: number;
  currency: string;
}

/**
 * React hook that fetches the authenticated user's wallet balance
 * from the `wallet_balances` table using TanStack Query.
 *
 * Returns { balance, currency } or null if not authenticated / not found.
 */
export function useWalletBalance() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const {
    data,
    isLoading: balanceLoading,
    error,
    refetch,
  } = useQuery<WalletBalance | null>({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: wallet, error } = await supabase
        .from("wallet_balances")
        .select("balance, currency")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch wallet balance:", error);
        return null;
      }

      if (!wallet) {
        // No wallet row — user was just created but the DB trigger hasn't fired yet
        return { balance: 0, currency: "USD" };
      }

      return {
        balance: Number(wallet.balance) || 0,
        currency: wallet.currency || "USD",
      };
    },
    enabled: isAuthenticated,
    staleTime: 30_000, // 30 seconds — balance can change
    refetchInterval: 60_000, // Auto-refetch every minute
  });

  return {
    balance: data?.balance ?? 0,
    currency: data?.currency ?? "USD",
    isLoading: authLoading || balanceLoading,
    error,
    refetch,
  };
}
