"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
      // For now, show a placeholder success
      // In the future, this will call SAM API to create a recharge invoice
      await new Promise((r) => setTimeout(r, 1000));
      setIsSuccess(true);
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
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-6">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "طلب الشحن قيد المعالجة" : "Recharge Request Submitted"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRtl
              ? "سيتم إضافة الرصيد إلى محفظتك بعد تأكيد الدفع"
              : "Funds will be added to your wallet after payment confirmation"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => router.push(`/${locale}/wallet`)}>
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          {isRtl ? "→ العودة للمحفظة" : "← Back to Wallet"}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {isRtl ? "شحن المحفظة" : "Recharge Wallet"}
            </CardTitle>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
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
                    "rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-muted",
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
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                    paymentMethod === "shamcash" && "border-primary ring-1 ring-primary",
                  )}
                >
                  <RadioGroupItem value="shamcash" id="shamcash" />
                  <CreditCard className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ShamCash</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "الدفع عبر محفظة شام كاش" : "Pay via ShamCash wallet"}
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="syriatel"
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                    paymentMethod === "syriatel" && "border-primary ring-1 ring-primary",
                  )}
                >
                  <RadioGroupItem value="syriatel" id="syriatel" />
                  <CreditCard className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Syriatel Cash</p>
                    <p className="text-xs text-muted-foreground">
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
                <><Loader2 className="size-4 animate-spin" /> {isRtl ? "جاري المعالجة..." : "Processing..."}</>
              ) : (
                <><ExternalLink className="size-4" /> {isRtl ? "شحن $" + amount : "Deposit $" + amount}</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
