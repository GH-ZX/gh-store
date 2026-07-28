"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Gift } from "lucide-react";
import type { StoreProduct } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

interface GiftCardScrollerProps {
  /** Gift card / voucher products to display */
  vouchers: StoreProduct[];
  isRtl: boolean;
}

/**
 * Horizontal scrollable row of gift card logos.
 * Like hesap.com.tr's "Tüm Platformlar İçin Oyun & Hediye Kartları" section.
 */
export function GiftCardScroller({ vouchers, isRtl }: GiftCardScrollerProps) {
  const params = useParams<{ locale: string }>();

  if (vouchers.length === 0) return null;

  // Take up to 12 gift cards
  const items = vouchers.slice(0, 12);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Gift className="size-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRtl ? "بطاقات الهدايا والقسائم" : "Gift Cards & Vouchers"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isRtl
              ? `اختر من ${vouchers.length} بطاقة رقمية من أشهر المنصات`
              : `Choose from ${vouchers.length} digital gift cards from top platforms`}
          </p>
        </div>
      </div>

      {/* Horizontal scrollable row */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 snap-x snap-mandatory">
          {items.map((voucher) => {
            const meta = voucher.metadata as Record<string, unknown> | undefined;
            const amounts = meta?.amounts as Array<{ unit_price: number; face_value: number | null }> | undefined;
            const sorted = amounts ? [...amounts].sort((a, b) => a.unit_price - b.unit_price) : [];
            const minPrice = sorted.length > 0 ? sorted[0].unit_price : voucher.basePrice;
            const maxPrice = sorted.length > 0 ? sorted[sorted.length - 1].unit_price : voucher.basePrice;

            // Extract platform name for display (first word or short name)
            const name = isRtl ? voucher.nameAr : voucher.nameEn;
            const shortName = name.length > 18 ? name.slice(0, 16) + "…" : name;

            return (
              <Link
                key={voucher.id}
                href={`/${params?.locale || "ar"}/store/${voucher.slug}`}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[100px] sm:min-w-[120px]",
                  "rounded-xl border p-3 sm:p-4",
                  "bg-card hover:bg-accent/50 transition-all",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "snap-start shrink-0",
                )}
              >
                {/* Icon placeholder */}
                <div className="size-10 sm:size-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  {voucher.imageUrl ? (
                    <img src={voucher.imageUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                  ) : (
                    <Gift className="size-5 sm:size-6 text-muted-foreground/30" />
                  )}
                </div>

                {/* Name */}
                <p className="text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-2">
                  {shortName}
                </p>

                {/* Price range */}
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  ${minPrice.toFixed(2)}–${maxPrice.toFixed(2)}
                </p>
              </Link>
            );
          })}

          {/* View all link */}
          <Link
            href={`/${params?.locale || "ar"}/store`}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[80px] sm:min-w-[100px]",
              "rounded-xl border border-dashed p-3 sm:p-4",
              "hover:bg-accent/50 transition-all",
              "snap-start shrink-0",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-lg sm:text-xl font-bold">+</span>
            <span className="text-[10px] sm:text-xs font-medium">
              {isRtl ? "عرض الكل" : "View All"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
