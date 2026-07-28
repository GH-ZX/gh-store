"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label: string;
  labelPlural: string;
  isRtl: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  label,
  labelPlural,
  isRtl,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <p className="text-xs text-muted-foreground">
        {isRtl
          ? `الصفحة ${currentPage} من ${totalPages} (${totalItems} ${currentPage === 1 && totalItems <= 20 ? label : labelPlural})`
          : `Page ${currentPage} of ${totalPages} (${totalItems} ${totalItems === 1 ? label : labelPlural})`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="size-8 p-0"
          aria-label={isRtl ? "الصفحة السابقة" : "Previous page"}
        >
          {isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
          .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis");
            acc.push(p);
            return acc;
          }, [])
          .map((item, ei) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${ei}`} className="text-xs text-muted-foreground px-1">
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={currentPage === item ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(item)}
                className="size-8 p-0 text-xs"
                aria-label={isRtl ? `الصفحة ${item}` : `Page ${item}`}
              >
                {item}
              </Button>
            )
          )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="size-8 p-0"
          aria-label={isRtl ? "الصفحة التالية" : "Next page"}
        >
          {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
