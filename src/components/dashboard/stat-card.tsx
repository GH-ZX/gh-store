"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  titleAr?: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  titleAr,
  value,
  icon,
  trend,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-6 transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{titleAr || title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
        {icon && (
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          {trend.isPositive ? (
            <TrendingUp className="size-4 text-emerald-500" />
          ) : (
            <TrendingDown className="text-destructive size-4" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-emerald-500" : "text-destructive",
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-muted-foreground text-xs">
            {description ? "vs last period" : ""}
          </span>
        </div>
      )}
    </Card>
  );
}
