"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  className?: string;
}

export function ProductCard({
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
  className,
}: ProductCardProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";
  const hasDiscount = originalPrice && originalPrice > price;

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
            className="absolute top-3 right-3 size-8 rounded-full bg-background/60 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              // TODO: add to wishlist
            }}
          >
            <Heart className="size-4" />
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
          className="w-full gap-2 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            // TODO: quick add to cart
          }}
        >
          <ShoppingCart className="size-4" />
          {isRtl ? "أضف إلى السلة" : "Add to Cart"}
        </Button>
      </div>
    </Card>
  );
}
