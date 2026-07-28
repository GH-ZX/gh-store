"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Tag } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CartItem } from "@/components/store/cart-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCartStore, getCartItemCount, getCartTotal } from "@/stores/cart-store";

export default function CartPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const itemCount = useMemo(() => getCartItemCount(items), [items]);
  const subtotal = useMemo(() => getCartTotal(items), [items]);

  if (items.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <EmptyState
            icon={<ShoppingCart className="size-8" />}
            title={isRtl ? "سلتك فارغة" : "Your cart is empty"}
            titleAr="سلتك فارغة"
            description={
              isRtl
                ? "لم تقم بإضافة أي منتجات بعد. تصفح المتجر لبدء التسوق."
                : "You haven't added any products yet. Browse the store to start shopping."
            }
            descriptionAr="لم تقم بإضافة أي منتجات بعد. تصفح المتجر لبدء التسوق."
            action={{
              label: isRtl ? "تصفح المتجر" : "Browse Store",
              labelAr: isRtl ? "تصفح المتجر" : undefined,
              onClick: () => router.push(`/${locale}/store`),
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* ─── Header ──────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRtl ? "سلة التسوق" : "Shopping Cart"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isRtl
                ? `${itemCount} ${itemCount === 1 ? "منتج" : "منتجات"} في سلتك`
                : `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1"
            onClick={clearCart}
          >
            <Trash2 className="size-4" />
            {isRtl ? "تفريغ السلة" : "Clear Cart"}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─── Items List ────────────────────────── */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {/* Continue Shopping */}
            <Link
              href={`/${locale}/store`}
              className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-1 text-sm transition-colors"
            >
              {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              {isRtl ? "مواصلة التسوق" : "Continue Shopping"}
            </Link>
          </div>

          {/* ─── Order Summary ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-card sticky top-24 space-y-4 rounded-xl border p-6">
              <h2 className="text-lg font-semibold">{isRtl ? "ملخص الطلب" : "Order Summary"}</h2>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRtl ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              {/* Items count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{isRtl ? "عدد المنتجات" : "Items"}</span>
                <span className="font-medium">{itemCount}</span>
              </div>

              <Separator />

              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">{isRtl ? "كود الخصم" : "Coupon Code"}</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={isRtl ? "أدخل الكود" : "Enter code"}
                    className="h-9 flex-1 text-sm"
                  />
                  <Button variant="outline" size="sm" className="shrink-0">
                    {isRtl ? "تطبيق" : "Apply"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-primary text-xl font-bold">${subtotal.toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => router.push(`/${locale}/checkout`)}
              >
                <ShoppingCart className="size-4" />
                {isRtl ? "متابعة الدفع" : "Proceed to Checkout"}
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                {isRtl ? "الدفع آمن ومشفر بالكامل" : "Payment is secure and fully encrypted"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
