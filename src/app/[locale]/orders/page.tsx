"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// ─── Mock Order Data ─────────────────────────────────

interface MockOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface MockOrder {
  id: string;
  orderNumber: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  createdAt: string;
  total: number;
  items: MockOrderItem[];
}

const mockOrders: MockOrder[] = [
  {
    id: "o-1",
    orderNumber: "GH-20260728-001",
    status: "completed",
    createdAt: "2026-07-28T10:30:00Z",
    total: 14.97,
    items: [
      { name: "PUBG Mobile - UC Top-Up", quantity: 3, price: 4.99 },
    ],
  },
  {
    id: "o-2",
    orderNumber: "GH-20260727-002",
    status: "processing",
    createdAt: "2026-07-27T15:45:00Z",
    total: 25.00,
    items: [
      { name: "Google Play Gift Card", quantity: 1, price: 25.00 },
    ],
  },
  {
    id: "o-3",
    orderNumber: "GH-20260725-003",
    status: "completed",
    createdAt: "2026-07-25T09:15:00Z",
    total: 59.98,
    items: [
      { name: "Windows 11 Pro - License", quantity: 1, price: 29.99 },
      { name: "ChatGPT Plus - 1 Month", quantity: 1, price: 20.00 },
      { name: "Free Fire - Diamonds", quantity: 2, price: 4.99 },
    ],
  },
  {
    id: "o-4",
    orderNumber: "GH-20260720-004",
    status: "cancelled",
    createdAt: "2026-07-20T14:00:00Z",
    total: 12.99,
    items: [
      { name: "Netflix Premium - 1 Month", quantity: 1, price: 12.99 },
    ],
  },
];

// ─── Status Config ───────────────────────────────────

const statusConfig: Record<string, { labelAr: string; labelEn: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { labelAr: "قيد الانتظار", labelEn: "Pending", variant: "outline" },
  processing: { labelAr: "قيد المعالجة", labelEn: "Processing", variant: "secondary" },
  completed: { labelAr: "مكتمل", labelEn: "Completed", variant: "default" },
  cancelled: { labelAr: "ملغي", labelEn: "Cancelled", variant: "destructive" },
  refunded: { labelAr: "مسترجع", labelEn: "Refunded", variant: "outline" },
};

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (mockOrders.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title={isRtl ? "لا توجد طلبات" : "No orders yet"}
            titleAr="لا توجد طلبات"
            description={
              isRtl
                ? "لم تقم بشراء أي منتجات بعد. تصفح المتجر لبدء التسوق."
                : "You haven't placed any orders yet. Browse the store to get started."
            }
            descriptionAr="لم تقم بشراء أي منتجات بعد. تصفح المتجر لبدء التسوق."
            action={{
              label: isRtl ? "تصفح المتجر" : "Browse Store",
              onClick: () => window.location.href = `/${locale}/store`,
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* ─── Header ──────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isRtl ? "طلباتي" : "My Orders"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRtl
              ? `عرض ${mockOrders.length} طلب`
              : `Viewing ${mockOrders.length} orders`}
          </p>
        </div>

        {/* ─── Order Cards ─────────────────────────── */}
        <div className="space-y-4">
          {mockOrders.map((order) => {
            const status = statusConfig[order.status];
            const isExpanded = expandedId === order.id;

            return (
              <Card key={order.id} className="overflow-hidden transition-colors hover:border-border/80">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  {/* Status icon */}
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    order.status === "completed" && "bg-green-100 dark:bg-green-900",
                    order.status === "processing" && "bg-blue-100 dark:bg-blue-900",
                    order.status === "cancelled" && "bg-red-100 dark:bg-red-900",
                    order.status === "pending" && "bg-muted",
                    order.status === "refunded" && "bg-orange-100 dark:bg-orange-900",
                  )}>
                    {order.status === "completed" && <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />}
                    {order.status === "processing" && <Clock className="size-5 text-blue-600 dark:text-blue-400" />}
                    {order.status === "cancelled" && <XCircle className="size-5 text-red-600 dark:text-red-400" />}
                    {order.status === "pending" && <AlertCircle className="size-5 text-muted-foreground" />}
                    {order.status === "refunded" && <Package className="size-5 text-orange-600 dark:text-orange-400" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{order.orderNumber}</span>
                      <Badge variant={status.variant} className="text-[10px]">
                        {isRtl ? status.labelAr : status.labelEn}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt, locale)}
                      {" · "}
                      {order.items.length} {isRtl ? "منتج" : "items"}
                    </p>
                  </div>

                  {/* Total + Expand */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold">${order.total.toFixed(2)}</span>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                            <Package className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isRtl ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between border-t pt-3 text-sm font-semibold">
                      <span>{isRtl ? "الإجمالي" : "Total"}</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* ─── Continue Shopping ────────────────────── */}
        <div className="mt-8 text-center">
          <Link href={`/${locale}/store`}>
            <Button variant="outline">
              {isRtl ? "مواصلة التسوق" : "Continue Shopping"}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
