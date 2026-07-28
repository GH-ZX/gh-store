"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreProduct } from "@/hooks/use-products";

interface QuickActionsProps {
  /** Games to show as quick-action buttons */
  games: StoreProduct[];
  isRtl: boolean;
}

/**
 * Horizontal row of quick-action buttons for popular games.
 * Like hesap.com.tr's "PUBG MOBILE UC %15 İNDİRİMLİ SATIN AL" buttons.
 */
export function QuickActions({ games, isRtl }: QuickActionsProps) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";

  if (games.length === 0) return null;

  // Take first 5 games
  const items = games.slice(0, 5);

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {items.map((game) => {
        const meta = game.metadata as Record<string, unknown> | undefined;
        const catalogue = meta?.catalogue as Array<{ name: string; amount: number }> | undefined;
        const sorted = catalogue ? [...catalogue].sort((a, b) => a.amount - b.amount) : [];
        const minPrice = sorted.length > 0 ? sorted[0].amount : game.basePrice;

        // Generate a "discount" label (random-ish for display)
        const discounts = [-15, -10, -20, -25, -5];
        const disc = discounts[items.indexOf(game) % discounts.length];

        return (
          <Link
            key={game.id}
            href={`/${locale}/store/${game.slug}`}
            className={cn(
              "group inline-flex items-center gap-2 sm:gap-3",
              "rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5",
              "bg-card hover:bg-accent/50 transition-all",
              "hover:shadow-md hover:-translate-y-0.5",
              "text-xs sm:text-sm font-medium",
              "shrink-0",
            )}
          >
            {/* Game icon */}
            <div className="relative size-7 sm:size-9 rounded-lg overflow-hidden bg-muted/50 shrink-0 flex items-center justify-center">
              {game.imageUrl ? (
                <img
                  src={game.imageUrl}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <Gamepad2 className="size-4 text-muted-foreground/40" />
              )}
            </div>

            {/* Game name + price */}
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate max-w-[120px] sm:max-w-[160px]">
                {isRtl ? game.nameAr : game.nameEn}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-primary">
                  ${minPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Discount badge */}
            <div className="shrink-0 bg-destructive/10 text-destructive text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md">
              {disc}%
            </div>

            {/* CTA */}
            <span className="hidden sm:inline text-[11px] font-semibold text-primary">
              {isRtl ? "اشتر الآن" : "Buy Now"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
