"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Wallet, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore, getCartTotal } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type PaymentMethod = "wallet" | "sam";

export default function CheckoutPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = useMemo(() => getCartTotal(items), [items]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearCart();
      setIsSuccess(true);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Empty Cart ──────────────────────────────────
  if (items.length === 0 && !isSuccess) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <EmptyState
            icon={<ShoppingCart className="size-8" />}
            title={isRtl ? "سلتك فارغة" : "Your cart is empty"}
            titleAr="سلتك فارغة"
            description={
              isRtl
                ? "أضف منتجات إلى سلتك قبل متابعة الدفع."
                : "Add products to your cart before checkout."
            }
            descriptionAr="أضف منتجات إلى سلتك قبل متابعة الدفع."
            action={{
              label: isRtl ? "تصفح المتجر" : "Browse Store",
              onClick: () => router.push(`/${locale}/store`),
            }}
          />
        </div>
      </main>
    );
  }

  // ─── Success State ───────────────────────────────
  if (isSuccess) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-6">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRtl ? "تم تأكيد الطلب!" : "Order Confirmed!"}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {isRtl
                ? "شكراً لك! تم استلام طلبك وسيتم معالجته قريباً. ستتلقى تأكيداً عبر البريد الإلكتروني."
                : "Thank you! Your order has been received and will be processed shortly. You'll receive a confirmation email."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push(`/${locale}/orders`)}>
                {isRtl ? "عرض الطلبات" : "View Orders"}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${locale}/store`)}>
                {isRtl ? "مواصلة التسوق" : "Continue Shopping"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* ─── Header ──────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isRtl ? "إتمام الطلب" : "Checkout"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRtl ? "راجع طلبك واختر طريقة الدفع" : "Review your order and select payment method"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─── Left: Payment & Details ───────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Login required */}
            {!authLoading && !isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isRtl ? "تسجيل الدخول مطلوب" : "Login Required"}
                  </CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "يجب تسجيل الدخول لإتمام الطلب"
                      : "You need to sign in to complete your order"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push(`/${locale}/auth/login?redirect=/${locale}/checkout`)}
                  >
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Items preview */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">
                {isRtl ? "المنتجات" : "Products"}
              </h2>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-xl border p-4"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/30">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-full rounded-lg object-cover"
                      />
                    ) : (
                      <ShoppingCart className="size-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <span className="text-sm font-medium shrink-0">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">
                {isRtl ? "طريقة الدفع" : "Payment Method"}
              </h2>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid gap-3"
              >
                <Label
                  htmlFor="wallet"
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors hover:bg-muted/50",
                    paymentMethod === "wallet" && "border-primary ring-1 ring-primary",
                  )}
                >
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Wallet className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isRtl ? "المحفظة" : "Wallet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl
                        ? "ادفع باستخدام رصيد محفظتك"
                        : "Pay using your wallet balance"}
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="sam"
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors hover:bg-muted/50",
                    paymentMethod === "sam" && "border-primary ring-1 ring-primary",
                  )}
                >
                  <RadioGroupItem value="sam" id="sam" />
                  <CreditCard className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">SAM API</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl
                        ? "ادفع عبر بوابة الدفع SAM"
                        : "Pay via SAM payment gateway"}
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>

          {/* ─── Right: Order Summary ──────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg">
                {isRtl ? "ملخص الطلب" : "Order Summary"}
              </h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRtl ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRtl ? "الخصم" : "Discount"}
                </span>
                <span>$0.00</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">
                  {isRtl ? "الإجمالي" : "Total"}
                </span>
                <span className="text-xl font-bold text-primary">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              {/* Place Order */}
              <Button
                size="lg"
                className="w-full gap-2"
                disabled={isSubmitting || !isAuthenticated}
                onClick={handleSubmitOrder}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isRtl ? "جاري المعالجة..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    {isRtl ? "تأكيد الطلب" : "Place Order"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {isRtl
                  ? "بالضغط على تأكيد الطلب، أنت توافق على الشروط والأحكام"
                  : "By placing this order, you agree to our Terms & Conditions"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
