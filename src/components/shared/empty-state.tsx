"use client";

import { useParams } from "next/navigation";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  action?: {
    label: string;
    labelAr?: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  titleAr,
  description,
  descriptionAr,
  action,
}: EmptyStateProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-full">
        {icon || <Inbox className="text-muted-foreground size-8" />}
      </div>
      <h3 className="text-lg font-semibold">
        {isRtl && titleAr ? titleAr : title || (isRtl ? "لا توجد نتائج" : "No results found")}
      </h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {isRtl && descriptionAr
          ? descriptionAr
          : description || (isRtl ? "لم يتم العثور على أي عناصر." : "No items were found.")}
      </p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {isRtl && action.labelAr ? action.labelAr : action.label}
        </Button>
      )}
    </div>
  );
}
