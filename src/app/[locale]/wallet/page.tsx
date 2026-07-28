"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  RotateCcw,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ExternalLink,
 Coins } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminProviderWallets } from "@/hooks/use-admin-wallets";
import { useAuth } from "@/hooks/use-auth";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useWalletTransactions } from "@/hooks/use-wallet-transactions";
import type { WalletTransaction } from "@/hooks/use-wallet-transactions";
import { cn } from "@/lib/utils";

// ─── Transaction Config ──────────────────────────────

const txConfig: Record<string, { labelAr: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  deposit: {
    labelAr: "إيداع",
    labelEn: "Deposit",
    icon: <ArrowDownLeft className="size-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  withdrawal: {
    labelAr: "سحب",
    labelEn: "Withdrawal",
    icon: <ArrowUpRight className="size-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  purchase: {
    labelAr: "شراء",
    labelEn: "Purchase",
    icon: <ShoppingCart className="size-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
  refund: {
    labelAr: "استرجاع",
    labelEn: "Refund",
    icon: <RotateCcw className="size-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  admin_adjustment: {
    labelAr: "تعديل يدوي",
    labelEn: "Adjustment",
    icon: <Plus className="size-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
};

const txBgColors: Record<string, string> = {
  deposit: "bg-green-100 dark:bg-green-900/50",
  purchase: "bg-orange-100 dark:bg-orange-900/50",
  refund: "bg-blue-100 dark:bg-blue-900/50",
  withdrawal: "bg-red-100 dark:bg-red-900/50",
  admin_adjustment: "bg-purple-100 dark:bg-purple-900/50",
};

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) {
    return locale === "ar" ? "أمس" : "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { weekday: "short" });
  }
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Component ───────────────────────────────────────

export default function WalletPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const [showBalance, setShowBalance] = useState(true);
  const { isAdmin } = useAuth();
  const { g2bulk, samWallets, samWalletsLoading, g2bulkLoading } = useAdminProviderWallets();

  const {
    balance,
    currency,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useWalletBalance();

  const {
    transactions,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useWalletTransactions(100);

  // ─── Derived Stats ───────────────────────────────────
  const stats = useMemo(() => {
    let totalDeposited = 0;
    let totalSpent = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        totalDeposited += tx.amount;
      } else {
        totalSpent += Math.abs(tx.amount);
      }
    }

    return {
      totalDeposited,
      totalSpent,
      count: transactions.length,
    };
  }, [transactions]);

  const isLoading = balanceLoading || txLoading;
  const hasError = !!balanceError;
  const isEmpty = !isLoading && !hasError && transactions.length === 0;

  // ─── Loading State ───────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="h-48 animate-pulse rounded-2xl bg-muted mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ─── Error State ─────────────────────────────────────
  if (hasError) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-14 text-destructive/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isRtl ? "فشل تحميل المحفظة" : "Failed to load wallet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {isRtl
                  ? "حدث خطأ أثناء تحميل بيانات المحفظة. حاول مرة أخرى."
                  : "An error occurred while loading wallet data. Please try again."}
              </p>
              <Button onClick={() => { refetchBalance(); refetchTx(); }} variant="outline" className="gap-2">
                <RefreshCw className="size-4" />
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* ─── Balance Card ─────────────────────────── */}
        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <WalletIcon className="size-4" />
                  <span>{isRtl ? "رصيد المحفظة" : "Wallet Balance"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight">
                    {showBalance ? `$${balance.toFixed(2)}` : "••••••"}
                  </span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currency} — {isRtl ? "دولار أمريكي" : "US Dollar"}
                </p>
              </div>

              <div className="flex gap-2">
                <Link href={`/${locale}/wallet/recharge`}>
                  <Button size="sm" className="gap-1">
                    <CreditCard className="size-3.5" />
                    {isRtl ? "شحن" : "Recharge"}
                  </Button>
                </Link>
                <Button size="sm" className="gap-1" variant="outline" onClick={() => refetchBalance()}>
                  <RefreshCw className="size-3.5" />
                  {isRtl ? "تحديث" : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "الرصيد الحالي" : "Current"}
                </p>
                <p className="text-sm font-bold">${balance.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المودع" : "Deposited"}
                </p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  +${stats.totalDeposited.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المنفق" : "Spent"}
                </p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  -${stats.totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Transactions Header ──────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isRtl ? "سجل المعاملات" : "Transaction History"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRtl
                ? `آخر ${stats.count} معاملة`
                : `Last ${stats.count} transactions`}
            </p>
          </div>
          {stats.count > 0 && (
            <Button variant="ghost" size="sm" onClick={() => refetchTx()} className="gap-1.5">
              <RefreshCw className="size-3.5" />
              {isRtl ? "تحديث" : "Refresh"}
            </Button>
          )}
        </div>

        {/* ─── Transactions List ────────────────────── */}
        {isEmpty ? (
          <EmptyState
            icon={<WalletIcon className="size-8" />}
            title={isRtl ? "لا توجد معاملات" : "No transactions"}
            titleAr="لا توجد معاملات"
            description={
              isRtl
                ? "لم تقم بأي معاملات بعد. قم بإيداع رصيد لبدء التسوق."
                : "You haven't made any transactions yet. Deposit funds to start shopping."
            }
            descriptionAr="لم تقم بأي معاملات بعد. قم بإيداع رصيد لبدء التسوق."
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: WalletTransaction) => {
              const config = txConfig[tx.type];
              const isCredit = tx.amount > 0;
              const isDebit = tx.amount < 0;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30"
                >
                  {/* Type icon */}
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    txBgColors[tx.type] || "bg-muted",
                  )}>
                    <span className={cn("size-4", config?.color)}>
                      {config?.icon}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {tx.description || (isRtl ? "معاملة" : "Transaction")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs font-medium", config?.color)}>
                        {isRtl ? config?.labelAr : config?.labelEn}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Amount + Balance */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      isCredit && "text-green-600 dark:text-green-400",
                      isDebit && "text-red-600 dark:text-red-400",
                    )}>
                      {isCredit ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      ${tx.balance_after.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SAM Provider Wallets ─── */}
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isRtl ? "محافظ SAM API" : "SAM API Wallets"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {samWalletsLoading
                ? (isRtl ? "جاري التحميل..." : "Loading...")
                : (isRtl
                  ? "أرصدة محافظ الدفع الإلكتروني"
                  : "E-wallet balances from SAM payment gateway")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {samWalletsLoading ? (
            /* Loading skeleton */
            <>
              <Card className="overflow-hidden animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-9 rounded-lg bg-muted" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-12 rounded bg-muted" />
                      <div className="h-4 w-20 rounded bg-muted" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-12 rounded bg-muted" />
                      <div className="h-4 w-24 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-9 rounded-lg bg-muted" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-12 rounded bg-muted" />
                      <div className="h-4 w-20 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : samWallets.length > 0 ? (
            samWallets.map((w) => (
              <Card key={w.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Coins className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{w.providerDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{w.label || w.phone || w.walletAddress?.slice(0, 16) || w.accountNumber?.slice(0, 16)}</p>
                      </div>
                    </div>
                  </div>

                  {w.balances && w.balances.length > 0 ? (
                    <div className="space-y-1.5">
                      {w.balances.map((b) => (
                        <div key={b.currency} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{b.currency}</span>
                          <span className={cn(
                            "font-bold tabular-nums",
                            Number(b.amount) > 0 ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {b.currency === "SYP"
                              ? `\u00a3S${Number(b.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                              : `$${Number(b.amount).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isRtl ? "غير متاح" : "Unavailable"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <p className="text-sm text-muted-foreground text-center py-8">
                {isRtl ? "انقر على 'تحديث' في لوحة تحكم SAM API لجلب المحافظ" : "Click 'Refresh' in the SAM API dashboard settings to fetch wallets"}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
