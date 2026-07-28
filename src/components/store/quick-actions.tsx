"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import type { StoreProduct } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

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
              "rounded-xl border px-3 py-2 sm:px-4 sm:py-2.5",
              "bg-card hover:bg-accent/50 transition-all",
              "hover:-translate-y-0.5 hover:shadow-md",
              "text-xs font-medium sm:text-sm",
              "shrink-0",
            )}
          >
            {/* Game icon */}
            <div className="bg-muted/50 relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-9">
              {game.imageUrl ? (
                <img src={game.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
              ) : (
                <Gamepad2 className="text-muted-foreground/40 size-4" />
              )}
            </div>

            {/* Game name + price */}
            <div className="min-w-0">
              <p className="max-w-[120px] truncate leading-tight font-semibold sm:max-w-[160px]">
                {isRtl ? game.nameAr : game.nameEn}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-primary text-[11px] font-bold">${minPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount badge */}
            <div className="bg-destructive/10 text-destructive shrink-0 rounded-md px-2 py-1 text-[10px] font-bold sm:text-xs">
              {disc}%
            </div>

            {/* CTA */}
            <span className="text-primary hidden text-[11px] font-semibold sm:inline">
              {isRtl ? "اشتر الآن" : "Buy Now"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
