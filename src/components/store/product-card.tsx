"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Heart, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

interface ProductCardProps {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  categoryAr?: string;
  categoryEn?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  isActive: boolean;
  /**
   * True when the buyer must choose a variant or fill required fields before
   * this product can be added to the cart — quick-add sends them to the
   * detail page instead of guessing a selection.
   */
  requiresSelection?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  slug,
  nameAr,
  nameEn,
  imageUrl,
  categoryAr,
  categoryEn,
  price,
  originalPrice,
  rating,
  isActive,
  requiresSelection = false,
  className,
}: ProductCardProps) {
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";
  const hasDiscount = originalPrice && originalPrice > price;

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  // Select the derived boolean directly so the card re-renders on change.
  const isWishlisted = useWishlistStore((s) => s.productIds.includes(id));
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (requiresSelection) {
      router.push(`/${locale}/store/${slug}`);
      return;
    }

    addItem({
      id,
      productId: id,
      name: isRtl ? nameAr : nameEn,
      imageUrl,
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      variantId: null,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        !isActive && "opacity-60",
        className,
      )}
    >
      <Link href={`/${params?.locale || "ar"}/store/${slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={isRtl ? nameAr : nameEn}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/30">
              <ShoppingCart className="size-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs font-medium">
                -{Math.round(((originalPrice! - price) / originalPrice!) * 100)}%
              </Badge>
            )}
          </div>

          {/* Wishlist button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isWishlisted
                ? isRtl
                  ? "إزالة من المفضلة"
                  : "Remove from wishlist"
                : isRtl
                  ? "أضف إلى المفضلة"
                  : "Add to wishlist"
            }
            aria-pressed={isWishlisted}
            className={cn(
              "absolute top-3 right-3 size-8 rounded-full bg-background/60 backdrop-blur-sm transition-opacity",
              // Stay visible once saved, otherwise reveal on hover/focus
              isWishlisted
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(id);
            }}
          >
            <Heart
              className={cn("size-4", isWishlisted && "fill-red-500 text-red-500")}
            />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-1.5 p-4">
          {categoryAr && (
            <p className="text-xs text-muted-foreground">
              {isRtl ? categoryAr : categoryEn}
            </p>
          )}

          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {isRtl ? nameAr : nameEn}
          </h3>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base font-bold">${price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick buy */}
      <div className="px-4 pb-4">
        <Button
          size="sm"
          disabled={!isActive}
          className="w-full gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={handleQuickAdd}
        >
          {justAdded ? (
            <>
              <Check className="size-4" />
              {isRtl ? "تمت الإضافة" : "Added"}
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              {!isActive
                ? isRtl
                  ? "غير متوفر"
                  : "Unavailable"
                : requiresSelection
                  ? isRtl
                    ? "اختر الخيارات"
                    : "Choose Options"
                  : isRtl
                    ? "أضف إلى السلة"
                    : "Add to Cart"}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
