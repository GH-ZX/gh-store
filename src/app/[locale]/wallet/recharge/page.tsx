"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function RechargePage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [amount, setAmount] = useState("10");
  const [paymentMethod, setPaymentMethod] = useState<"shamcash" | "syriatel">("shamcash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(isRtl ? "الرجاء إدخال مبلغ صحيح" : "Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, method: paymentMethod }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message || (isRtl ? "فشل إنشاء طلب الشحن" : "Failed to start recharge"));
        return;
      }

      // The balance is credited only after SAM confirms payment via webhook.
      setPaymentUrl(data.paymentUrl || null);
      setIsSuccess(true);

      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Recharge failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "طلب الشحن قيد المعالجة" : "Recharge Request Submitted"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRtl
              ? "سيتم إضافة الرصيد إلى محفظتك بعد تأكيد الدفع"
              : "Funds will be added to your wallet after payment confirmation"}
          </p>

          {/* The popup may have been blocked — always offer the link. */}
          {paymentUrl && (
            <Button
              className="mt-6 w-full sm:w-auto"
              render={<a href={paymentUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink className="size-4" />
              {isRtl ? "إتمام الدفع" : "Complete Payment"}
            </Button>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant={paymentUrl ? "outline" : "default"}
              onClick={() => router.push(`/${locale}/wallet`)}
            >
              {isRtl ? "العودة للمحفظة" : "Back to Wallet"}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/${locale}/store`)}>
              {isRtl ? "مواصلة التسوق" : "Continue Shopping"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Back link */}
        <Link
          href={`/${locale}/wallet`}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          {isRtl ? "→ العودة للمحفظة" : "← Back to Wallet"}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isRtl ? "شحن المحفظة" : "Recharge Wallet"}</CardTitle>
            <CardDescription>
              {isRtl
                ? "أدخل المبلغ الذي تريد شحنه واختر طريقة الدفع"
                : "Enter the amount you want to deposit and select payment method"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>{isRtl ? "المبلغ (USD)" : "Amount (USD)"}</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
                  $
                </span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                  placeholder="10.00"
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {["5", "10", "25", "50"].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={cn(
                    "hover:bg-muted rounded-lg border py-2 text-sm font-medium transition-colors",
                    amount === val && "border-primary bg-primary/5 text-primary",
                  )}
                >
                  ${val}
                </button>
              ))}
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>{isRtl ? "طريقة الدفع" : "Payment Method"}</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "shamcash" | "syriatel")}
                className="grid gap-2"
              >
                <Label
                  htmlFor="shamcash"
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    paymentMethod === "shamcash" && "border-primary ring-primary ring-1",
                  )}
                >
                  <RadioGroupItem value="shamcash" id="shamcash" />
                  <CreditCard className="text-primary size-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ShamCash</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? "الدفع عبر محفظة شام كاش" : "Pay via ShamCash wallet"}
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="syriatel"
                  className={cn(
                    "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                    paymentMethod === "syriatel" && "border-primary ring-primary ring-1",
                  )}
                >
                  <RadioGroupItem value="syriatel" id="syriatel" />
                  <CreditCard className="text-primary size-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Syriatel Cash</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? "الدفع عبر محفظة سيريتل كاش" : "Pay via Syriatel Cash wallet"}
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleRecharge}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />{" "}
                  {isRtl ? "جاري المعالجة..." : "Processing..."}
                </>
              ) : (
                <>
                  <ExternalLink className="size-4" />{" "}
                  {isRtl ? "شحن $" + amount : "Deposit $" + amount}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
