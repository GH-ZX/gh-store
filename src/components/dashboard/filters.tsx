"use client";

import { useParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  labelAr?: string;
  value: string;
}

interface FiltersProps {
  searchPlaceholder?: string;
  searchPlaceholderAr?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  dateRangeOptions?: FilterOption[];
  dateRangeValue?: string;
  onDateRangeChange?: (value: string) => void;
  activeFilters?: number;
  onClearFilters?: () => void;
  className?: string;
}

export function Filters({
  searchPlaceholder,
  searchPlaceholderAr,
  searchValue,
  onSearchChange,
  statusOptions,
  statusValue,
  onStatusChange,
  dateRangeOptions,
  dateRangeValue,
  onDateRangeChange,
  activeFilters,
  onClearFilters,
  className,
}: FiltersProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Search */}
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              isRtl
                ? searchPlaceholderAr
                : searchPlaceholder || (isRtl ? "بحث..." : "Search...")
            }
            className="h-9 pl-9"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Status filter */}
      {statusOptions && onStatusChange && (
        <Select
          value={statusValue}
          onValueChange={(value: string | null) => value && onStatusChange(value)}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder={isRtl ? "الحالة" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {isRtl ? "الكل" : "All"}
            </SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {isRtl ? opt.labelAr || opt.label : opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Date range filter */}
      {dateRangeOptions && onDateRangeChange && (
        <Select
          value={dateRangeValue}
          onValueChange={(value: string | null) => value && onDateRangeChange(value)}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder={isRtl ? "الفترة" : "Period"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {isRtl ? "الكل" : "All Time"}
            </SelectItem>
            {dateRangeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {isRtl ? opt.labelAr || opt.label : opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear filters */}
      {activeFilters != null && activeFilters > 0 && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1 text-muted-foreground"
        >
          <X className="size-3" />
          {isRtl ? "مسح" : "Clear"} ({activeFilters})
        </Button>
      )}
    </div>
  );
}
