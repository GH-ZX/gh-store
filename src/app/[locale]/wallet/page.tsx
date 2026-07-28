"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// ─── Mock Wallet Data ────────────────────────────────

interface MockTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "purchase" | "refund" | "admin_adjustment";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const mockBalance = 142.50;

const mockTransactions: MockTransaction[] = [
  {
    id: "tx-1",
    type: "deposit",
    amount: 100.00,
    balanceBefore: 0,
    balanceAfter: 100.00,
    description: "Deposit via SAM API",
    createdAt: "2026-07-25T10:30:00Z",
  },
  {
    id: "tx-2",
    type: "purchase",
    amount: -14.97,
    balanceBefore: 100.00,
    balanceAfter: 85.03,
    description: "PUBG Mobile - UC Top-Up",
    createdAt: "2026-07-26T14:15:00Z",
  },
  {
    id: "tx-3",
    type: "deposit",
    amount: 75.00,
    balanceBefore: 85.03,
    balanceAfter: 160.03,
    description: "Deposit via SAM API",
    createdAt: "2026-07-26T16:00:00Z",
  },
  {
    id: "tx-4",
    type: "purchase",
    amount: -25.00,
    balanceBefore: 160.03,
    balanceAfter: 135.03,
    description: "Google Play Gift Card",
    createdAt: "2026-07-27T09:30:00Z",
  },
  {
    id: "tx-5",
    type: "refund",
    amount: 12.99,
    balanceBefore: 135.03,
    balanceAfter: 148.02,
    description: "Refund - Netflix Premium (Cancelled)",
    createdAt: "2026-07-27T15:00:00Z",
  },
  {
    id: "tx-6",
    type: "purchase",
    amount: -5.52,
    balanceBefore: 148.02,
    balanceAfter: 142.50,
    description: "Free Fire - Diamonds × 2",
    createdAt: "2026-07-28T10:30:00Z",
  },
  {
    id: "tx-7",
    type: "deposit",
    amount: 50.00,
    balanceBefore: 142.50,
    balanceAfter: 192.50,
    description: "Deposit via SAM API",
    createdAt: "2026-07-28T12:00:00Z",
  },
  {
    id: "tx-8",
    type: "purchase",
    amount: -50.00,
    balanceBefore: 192.50,
    balanceAfter: 142.50,
    description: "PSN Gift Card",
    createdAt: "2026-07-28T14:00:00Z",
  },
];

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

export default function WalletPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading] = useState(false);

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
                    {showBalance ? `$${mockBalance.toFixed(2)}` : "••••••"}
                  </span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "USD - دولار أمريكي" : "USD - US Dollar"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="gap-1" onClick={() => console.log("Deposit clicked")}>
                  <Plus className="size-4" />
                  {isRtl ? "إيداع" : "Deposit"}
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "الرصيد الحالي" : "Current"}
                </p>
                <p className="text-sm font-bold">${mockBalance.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المودع" : "Deposited"}
                </p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  +$225.00
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "المنفق" : "Spent"}
                </p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  -$95.49
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Transactions Header ──────────────────── */}
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">
            {isRtl ? "سجل المعاملات" : "Transaction History"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isRtl
              ? `آخر ${mockTransactions.length} معاملة`
              : `Last ${mockTransactions.length} transactions`}
          </p>
        </div>

        {/* ─── Transactions List ────────────────────── */}
        {mockTransactions.length === 0 ? (
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
            {mockTransactions.map((tx) => {
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
                    tx.type === "deposit" && "bg-green-100 dark:bg-green-900",
                    tx.type === "purchase" && "bg-orange-100 dark:bg-orange-900",
                    tx.type === "refund" && "bg-blue-100 dark:bg-blue-900",
                    tx.type === "withdrawal" && "bg-red-100 dark:bg-red-900",
                    tx.type === "admin_adjustment" && "bg-purple-100 dark:bg-purple-900",
                  )}>
                    <span className={cn("size-4", txConfig[tx.type]?.color)}>
                      {txConfig[tx.type]?.icon}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs font-medium", txConfig[tx.type]?.color)}>
                        {isRtl ? config?.labelAr : config?.labelEn}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt, locale)}
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
                      ${tx.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
