"use client";

import { useParams } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ title, titleAr, message, messageAr, onRetry }: ErrorDisplayProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-destructive/10 mb-6 flex size-16 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive size-8" />
      </div>
      <h3 className="text-lg font-semibold">
        {isRtl && titleAr ? titleAr : title || (isRtl ? "حدث خطأ" : "Something went wrong")}
      </h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {isRtl && messageAr
          ? messageAr
          : message || (isRtl ? "يرجى المحاولة مرة أخرى." : "Please try again.")}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
          <RefreshCw className="size-4" />
          {isRtl ? "إعادة المحاولة" : "Retry"}
        </Button>
      )}
    </div>
  );
}
