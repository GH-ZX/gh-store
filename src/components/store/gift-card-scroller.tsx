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
      <div className="mb-5 flex items-center gap-3">
        <div className="bg-primary/10 text-primary rounded-xl p-2.5">
          <Gift className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {isRtl ? "بطاقات الهدايا والقسائم" : "Gift Cards & Vouchers"}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            {isRtl
              ? `اختر من ${vouchers.length} بطاقة رقمية من أشهر المنصات`
              : `Choose from ${vouchers.length} digital gift cards from top platforms`}
          </p>
        </div>
      </div>

      {/* Horizontal scrollable row */}
      <div className="relative">
        <div className="-mx-1 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto px-1 pb-2">
          {items.map((voucher) => {
            const meta = voucher.metadata as Record<string, unknown> | undefined;
            const amounts = meta?.amounts as
              Array<{ unit_price: number; face_value: number | null }> | undefined;
            const sorted = amounts ? [...amounts].sort((a, b) => a.unit_price - b.unit_price) : [];
            const minPrice = sorted.length > 0 ? sorted[0].unit_price : voucher.basePrice;
            const maxPrice =
              sorted.length > 0 ? sorted[sorted.length - 1].unit_price : voucher.basePrice;

            // Extract platform name for display (first word or short name)
            const name = isRtl ? voucher.nameAr : voucher.nameEn;
            const shortName = name.length > 18 ? name.slice(0, 16) + "…" : name;

            return (
              <Link
                key={voucher.id}
                href={`/${params?.locale || "ar"}/store/${voucher.slug}`}
                className={cn(
                  "flex min-w-[100px] flex-col items-center gap-2 sm:min-w-[120px]",
                  "rounded-xl border p-3 sm:p-4",
                  "bg-card hover:bg-accent/50 transition-all",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  "shrink-0 snap-start",
                )}
              >
                {/* Icon placeholder */}
                <div className="bg-muted/50 flex size-10 items-center justify-center rounded-xl sm:size-12">
                  {voucher.imageUrl ? (
                    <img
                      src={voucher.imageUrl}
                      alt=""
                      className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                    />
                  ) : (
                    <Gift className="text-muted-foreground/30 size-5 sm:size-6" />
                  )}
                </div>

                {/* Name */}
                <p className="line-clamp-2 text-center text-[11px] leading-tight font-semibold sm:text-xs">
                  {shortName}
                </p>

                {/* Price range */}
                <p className="text-muted-foreground text-center text-[10px] sm:text-xs">
                  ${minPrice.toFixed(2)}–${maxPrice.toFixed(2)}
                </p>
              </Link>
            );
          })}

          {/* View all link */}
          <Link
            href={`/${params?.locale || "ar"}/store`}
            className={cn(
              "flex min-w-[80px] flex-col items-center justify-center gap-1 sm:min-w-[100px]",
              "rounded-xl border border-dashed p-3 sm:p-4",
              "hover:bg-accent/50 transition-all",
              "shrink-0 snap-start",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-lg font-bold sm:text-xl">+</span>
            <span className="text-[10px] font-medium sm:text-xs">
              {isRtl ? "عرض الكل" : "View All"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
