"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import { useAuth } from "./use-auth";

export interface WalletTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "purchase" | "refund" | "admin_adjustment";
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

/**
 * React hook that fetches the authenticated user's wallet transactions
 * from the `wallet_transactions` table using TanStack Query.
 */
export function useWalletTransactions(limit = 50) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = createSupabaseBrowserClient();

  const {
    data,
    isLoading: txLoading,
    error,
    refetch,
  } = useQuery<WalletTransaction[]>({
    queryKey: ["wallet", "transactions", limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: txs, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to fetch wallet transactions:", error);
        return [];
      }

      return (txs || []).map((tx) => ({
        id: tx.id,
        type: tx.type as WalletTransaction["type"],
        amount: Number(tx.amount) || 0,
        balance_before: Number(tx.balance_before) || 0,
        balance_after: Number(tx.balance_after) || 0,
        description: tx.description,
        reference_type: tx.reference_type,
        reference_id: tx.reference_id,
        created_at: tx.created_at,
      }));
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    transactions: data ?? [],
    totalCount: data?.length ?? 0,
    isLoading: authLoading || txLoading,
    error,
    refetch,
  };
}
