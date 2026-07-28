"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Wallet,
  CreditCard,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useCartStore, getCartTotal } from "@/stores/cart-store";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");

  const subtotal = useMemo(() => getCartTotal(items), [items]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // No price fields: the server prices the order from the products table.
      // Anything sent here would be ignored, so sending it would only be
      // misleading.
      const payload: Record<string, unknown> = {
        paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId ?? null,
          fields: item.fields,
        })),
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message || (isRtl ? "فشل إنشاء الطلب" : "Failed to create order"));
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === "wallet") {
        // Wallet payment: success, update UI
        clearCart();
        setSuccessOrderNumber(data.orderNumber || "");
        setIsSuccess(true);
      } else if (paymentMethod === "sam" && data.paymentUrl) {
        // SAM payment: redirect to payment URL
        clearCart();
        setSuccessOrderNumber(data.orderNumber || "");
        setIsSuccess(true);

        // Auto-redirect to SAM payment page after a short delay
        setTimeout(() => {
          window.open(data.paymentUrl, "_blank");
        }, 500);
      } else {
        // SAM payment but no URL (unexpected)
        clearCart();
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Order error:", err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
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
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isRtl ? "تم تأكيد الطلب!" : "Order Confirmed!"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {successOrderNumber && (
                <span className="text-foreground font-mono">{successOrderNumber}</span>
              )}
            </p>
            <p className="text-muted-foreground mt-3">
              {isRtl
                ? "شكراً لك! تم استلام طلبك وسيتم معالجته قريباً."
                : "Thank you! Your order has been received and will be processed shortly."}
            </p>

            {paymentMethod === "sam" && (
              <div className="bg-primary/5 mt-4 rounded-lg p-4 text-sm">
                <p className="mb-1 font-medium">
                  {isRtl
                    ? "🚀 تم فتح صفحة الدفع في نافذة جديدة"
                    : "🚀 Payment page opened in a new window"}
                </p>
                <p className="text-muted-foreground">
                  {isRtl
                    ? "قم بإتمام الدفع عبر SAM API. بعد الدفع، سيتم تأكيد طلبك تلقائياً."
                    : "Complete your payment via SAM API. Your order will be confirmed automatically after payment."}
                </p>
              </div>
            )}

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
          <p className="text-muted-foreground mt-1 text-sm">
            {isRtl ? "راجع طلبك واختر طريقة الدفع" : "Review your order and select payment method"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ─── Left: Payment & Details ───────────── */}
          <div className="space-y-8 lg:col-span-2">
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
                    onClick={() =>
                      router.push(`/${locale}/auth/login?redirect=/${locale}/checkout`)
                    }
                  >
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Items preview */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{isRtl ? "المنتجات" : "Products"}</h2>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-xl border p-4">
                  <div className="bg-muted text-muted-foreground/30 flex size-12 shrink-0 items-center justify-center rounded-lg">
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{isRtl ? "طريقة الدفع" : "Payment Method"}</h2>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid gap-3"
              >
                <Label
                  htmlFor="wallet"
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors",
                    paymentMethod === "wallet" && "border-primary ring-primary ring-1",
                  )}
                >
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Wallet className="text-primary size-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{isRtl ? "المحفظة" : "Wallet"}</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? "ادفع باستخدام رصيد محفظتك" : "Pay using your wallet balance"}
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="sam"
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors",
                    paymentMethod === "sam" && "border-primary ring-primary ring-1",
                  )}
                >
                  <RadioGroupItem value="sam" id="sam" />
                  <CreditCard className="text-primary size-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">SAM API</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl
                        ? "ادفع عبر ShamCash أو Syriatel Cash"
                        : "Pay via ShamCash or Syriatel Cash"}
                    </p>
                  </div>
                </Label>
              </RadioGroup>

              {/* SAM info note */}
              {paymentMethod === "sam" && (
                <div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
                  <p className="text-muted-foreground text-sm">
                    {isRtl
                      ? "سيتم توجيهك إلى بوابة الدفع SAM API عند تأكيد الطلب. اختر طريقة الدفع المناسبة (ShamCash أو Syriatel Cash) في صفحة الدفع."
                      : "You will be redirected to the SAM API payment gateway after placing your order. Select your preferred payment method (ShamCash or Syriatel Cash) on the payment page."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right: Order Summary ──────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-card sticky top-24 space-y-4 rounded-xl border p-6">
              <h2 className="text-lg font-semibold">{isRtl ? "ملخص الطلب" : "Order Summary"}</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground max-w-[180px] truncate">
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
                <span className="text-muted-foreground">{isRtl ? "الخصم" : "Discount"}</span>
                <span>$0.00</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">{isRtl ? "الإجمالي" : "Total"}</span>
                <span className="text-primary text-xl font-bold">${subtotal.toFixed(2)}</span>
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
                    {paymentMethod === "sam" ? (
                      <ExternalLink className="size-4" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    {paymentMethod === "sam"
                      ? isRtl
                        ? "الدفع عبر SAM"
                        : "Pay with SAM"
                      : isRtl
                        ? "تأكيد الطلب"
                        : "Place Order"}
                  </>
                )}
              </Button>

              <p className="text-muted-foreground text-center text-xs">
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
