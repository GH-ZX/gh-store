"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dynamic_fields: Record<string, string>;
  status: string;
}

interface Order {
  id: string;
  order_number: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

// ─── Status Config ───────────────────────────────────

const statusConfig: Record<string, { labelAr: string; labelEn: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { labelAr: "قيد الانتظار", labelEn: "Pending", variant: "outline" },
  processing: { labelAr: "قيد المعالجة", labelEn: "Processing", variant: "secondary" },
  completed: { labelAr: "مكتمل", labelEn: "Completed", variant: "default" },
  cancelled: { labelAr: "ملغي", labelEn: "Cancelled", variant: "destructive" },
  refunded: { labelAr: "مسترجع", labelEn: "Refunded", variant: "outline" },
};

const paymentStatusConfig: Record<string, { labelAr: string; labelEn: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { labelAr: "قيد الدفع", labelEn: "Pending", variant: "outline" },
  paid: { labelAr: "تم الدفع", labelEn: "Paid", variant: "default" },
  failed: { labelAr: "فشل الدفع", labelEn: "Failed", variant: "destructive" },
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

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/list");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // ─── Loading State ───────────────────────────────
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

  // ─── Error State ─────────────────────────────────
  if (error) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-14 text-destructive/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isRtl ? "فشل تحميل الطلبات" : "Failed to load orders"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {error}
              </p>
              <Button onClick={fetchOrders} variant="outline" className="gap-2">
                <RefreshCw className="size-4" />
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // ─── Empty State ─────────────────────────────────
  if (orders.length === 0) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRtl ? "طلباتي" : "My Orders"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRtl
                ? `عرض ${orders.length} طلب`
                : `Viewing ${orders.length} orders`}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchOrders} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            {isRtl ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* ─── Order Cards ─────────────────────────── */}
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const payStatus = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending;
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
                      <span className="text-sm font-semibold">{order.order_number}</span>
                      <Badge variant={status.variant} className="text-[10px]">
                        {isRtl ? status.labelAr : status.labelEn}
                      </Badge>
                      <Badge variant={payStatus.variant} className="text-[10px]">
                        {isRtl ? payStatus.labelAr : payStatus.labelEn}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(order.created_at, locale)}</span>
                      <span>·</span>
                      <span>{formatTime(order.created_at, locale)}</span>
                      <span>·</span>
                      <span>
                        {order.payment_method === "wallet"
                          ? (isRtl ? "محفظة" : "Wallet")
                          : "SAM API"}
                      </span>
                      <span>·</span>
                      <span>
                        {order.order_items?.length || 0} {isRtl ? "منتج" : "items"}
                      </span>
                    </div>
                  </div>

                  {/* Total + Expand */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold">${Number(order.total).toFixed(2)}</span>
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
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                            <Package className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {(item.dynamic_fields as Record<string, string>)?.product_name || (isRtl ? `منتج #${item.product_id.slice(0, 8)}` : `Product #${item.product_id.slice(0, 8)}`)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isRtl ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">${Number(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Payment & Order Details */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRtl ? "طريقة الدفع" : "Payment Method"}
                        </span>
                        <span className="font-medium">
                          {order.payment_method === "wallet"
                            ? (isRtl ? "المحفظة" : "Wallet")
                            : "SAM API"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRtl ? "حالة الدفع" : "Payment Status"}
                        </span>
                        <Badge variant={payStatus.variant} className="text-[10px]">
                          {isRtl ? payStatus.labelAr : payStatus.labelEn}
                        </Badge>
                      </div>
                      {order.notes && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {isRtl ? "ملاحظات" : "Notes"}
                          </span>
                          <span className="font-medium">{order.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between border-t pt-3 text-sm font-semibold">
                      <span>{isRtl ? "الإجمالي" : "Total"}</span>
                      <span>${Number(order.total).toFixed(2)}</span>
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
