"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

/**
 * SAM wallet balance entry from the API.
 */
interface SamWalletBalance {
  currency: string;
  amount: number;
  label: string | null;
}

/**
 * SAM wallet details as returned by /api/sam/wallets.
 */
interface SamWallet {
  id: string;
  provider: string;
  providerDisplayName: string;
  label: string;
  balances: SamWalletBalance[];
  phone?: string;
  walletAddress?: string;
  accountNumber?: string;
}

/**
 * G2Bulk provider user info with balance.
 */
interface G2BulkInfo {
  username: string;
  firstName: string;
  balance: number;
}

/**
 * Combined admin wallet info.
 */
export interface AdminWalletInfo {
  g2bulk: G2BulkInfo | null;
  g2bulkLoading: boolean;
  samWallets: SamWallet[];
  samWalletsLoading: boolean;
}

/**
 * Hook that fetches G2Bulk user info + SAM API wallet balances for the admin.
 * Only fetches if the user is an admin.
 */
export function useAdminProviderWallets() {
  const { isAdmin, isLoading: authLoading } = useAuth();

  // Fetch G2Bulk user info (via catalog which returns user + balance)
  const {
    data: g2bulkData,
    isLoading: g2bulkLoading,
  } = useQuery<G2BulkInfo | null>({
    queryKey: ["admin", "g2bulk-info"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/g2bulk/catalog");
        const data = await res.json();
        if (data.success && data.user) {
          return data.user;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  // Fetch SAM API wallets with balances
  const {
    data: samWalletsData,
    isLoading: samWalletsLoading,
  } = useQuery<SamWallet[]>({
    queryKey: ["admin", "sam-wallets"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/sam/wallets");
        const data = await res.json();
        if (data.success && Array.isArray(data.wallets)) {
          return data.wallets.map((w: Record<string, unknown>) => ({
            id: String(w.id || ""),
            provider: String(w.provider || ""),
            providerDisplayName: String(w.providerDisplayName || w.provider || ""),
            label: String(w.label || ""),
            balances: Array.isArray(w.balances) ? w.balances : [],
            phone: w.phone ? String(w.phone) : undefined,
            walletAddress: w.walletAddress ? String(w.walletAddress) : undefined,
            accountNumber: w.accountNumber ? String(w.accountNumber) : undefined,
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  return {
    isAdmin,
    isLoading: authLoading,
    g2bulk: g2bulkData ?? null,
    g2bulkLoading,
    samWallets: samWalletsData ?? [],
    samWalletsLoading,
  };
}
