"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  products: StoreProduct[];
  isLoading?: boolean;
}

// ─── Generate a dynamic promotion title for each game ──────
function getPromoTitle(game: StoreProduct, isRtl: boolean): string {
  const meta = game.metadata as Record<string, unknown> | undefined;
  const catalogue = meta?.catalogue as Array<{ name: string; amount: number }> | undefined;
  if (catalogue && catalogue.length > 0) {
    const sorted = [...catalogue].sort((a, b) => a.amount - b.amount);
    const minAmt = sorted[0].amount;
    // Generate a promo based on the game
    if (minAmt < 1) {
      return isRtl ? "أقل من $1!" : "Under $1!";
    }
    if (catalogue.length > 20) {
      return isRtl ? `${catalogue.length}+ خيار متاح` : `${catalogue.length}+ Options Available`;
    }
  }
  return isRtl ? "عروض حصرية" : "Exclusive Offers";
}

function getPromoDescription(game: StoreProduct, isRtl: boolean): string {
  const meta = game.metadata as Record<string, unknown> | undefined;
  const catalogue = meta?.catalogue as Array<{ name: string; amount: number }> | undefined;
  if (catalogue && catalogue.length > 0) {
    const sorted = [...catalogue].sort((a, b) => a.amount - b.amount);
    const minPrice = sorted[0].amount;
    const maxPrice = sorted[sorted.length - 1].amount;
    return isRtl
      ? `أسعار تبدأ من $${minPrice.toFixed(2)} — شحن فوري`
      : `Prices from $${minPrice.toFixed(2)} — Instant delivery`;
  }
  return isRtl
    ? "شحن فوري بأفضل الأسعار"
    : "Instant delivery at the best prices";
}

// ─── Game-specific promo badges ──────────────────────────
function getPromoBadge(game: StoreProduct, isRtl: boolean): string {
  const meta = game.metadata as Record<string, unknown> | undefined;
  const catalogue = meta?.catalogue as Array<{ name: string; amount: number }> | undefined;
  if (catalogue && catalogue.length > 0) {
    const count = catalogue.length;
    if (count >= 10) return isRtl ? `${count} خيار` : `${count} Options`;
  }
  return isRtl ? "متوفر الآن" : "Available Now";
}

export function HeroCarousel({ products, isLoading }: HeroCarouselProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      direction: isRtl ? "rtl" : "ltr",
      skipSnaps: false,
      duration: 25,
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <div className="aspect-[21/9] animate-pulse bg-muted-foreground/10" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* ─── Main Carousel ─────────────────────────── */}
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {products.map((product) => {
            const promoTitle = getPromoTitle(product, isRtl);
            const promoDesc = getPromoDescription(product, isRtl);
            const promoBadge = getPromoBadge(product, isRtl);

            return (
              <div
                key={product.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                <Link
                  href={`/${params?.locale || "ar"}/store/${product.slug}`}
                  className="relative block overflow-hidden"
                >
                  <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
                    {/* Full background image */}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain md:object-cover scale-105"
                        loading="lazy"
                      />
                    ) : null}

                    {/* Dark gradient overlay — like hesap.com.tr's dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 md:px-16 lg:px-20">
                      {/* Category badge */}
                      <Badge
                        variant="secondary"
                        className="w-fit mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium bg-white/15 text-white/90 border-white/20 backdrop-blur-sm uppercase tracking-wider"
                      >
                        {isRtl ? product.categoryAr : product.categoryEn}
                      </Badge>

                      {/* Game name */}
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold max-w-2xl leading-tight text-white drop-shadow-lg">
                        {isRtl ? product.nameAr : product.nameEn}
                      </h2>

                      {/* Promotion title (the "ROYALE PASS A20" part) */}
                      <p className="mt-1 sm:mt-2 text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-400 drop-shadow">
                        {promoTitle}
                      </p>

                      {/* Promo badge */}
                      <div className="mt-2 sm:mt-3 flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] sm:text-xs font-semibold gap-1">
                          <Zap className="size-3" />
                          {promoBadge}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-white/70 max-w-lg line-clamp-2 drop-shadow">
                        {promoDesc}
                      </p>

                      {/* CTA */}
                      <div className="mt-4 sm:mt-6 flex items-center gap-3">
                        <Button
                          size="sm"
                          className="shadow-lg bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-xs sm:text-sm px-4 sm:px-6"
                        >
                          {isRtl ? "تسوق الآن" : "Shop Now"}
                        </Button>
                        <span className="text-xs sm:text-sm text-white/50">
                          {isRtl ? "توصيل فوري" : "Instant delivery"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Arrow Navigation ──────────────────────── */}
      {isRtl ? (
        <>
          <button
            onClick={scrollPrev}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-2 md:right-4",
              "flex size-8 md:size-10 items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-black/60 focus:outline-none text-white",
              "hidden md:flex",
            )}
            aria-label="السابق"
          >
            <ChevronRight className="size-4 md:size-5" />
          </button>
          <button
            onClick={scrollNext}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 left-2 md:left-4",
              "flex size-8 md:size-10 items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-black/60 focus:outline-none text-white",
              "hidden md:flex",
            )}
            aria-label="التالي"
          >
            <ChevronLeft className="size-4 md:size-5" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={scrollPrev}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 left-2 md:left-4",
              "flex size-8 md:size-10 items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-black/60 focus:outline-none text-white",
              "hidden md:flex",
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4 md:size-5" />
          </button>
          <button
            onClick={scrollNext}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-2 md:right-4",
              "flex size-8 md:size-10 items-center justify-center",
              "rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-black/60 focus:outline-none text-white",
              "hidden md:flex",
            )}
            aria-label="Next"
          >
            <ChevronRight className="size-4 md:size-5" />
          </button>
        </>
      )}

      {/* ─── Bottom Thumbnail Strip ────────────────── */}
      {scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 md:mt-5">
          {products.map((product, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={product.id}
                onClick={() => scrollTo(index)}
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 transition-all duration-300",
                  "h-10 sm:h-12 md:h-14 shrink-0",
                  isActive
                    ? "border-yellow-500 w-14 sm:w-20 md:w-24 opacity-100"
                    : "border-transparent w-10 sm:w-12 md:w-16 opacity-40 hover:opacity-70 hover:w-12 sm:hover:w-16 md:hover:w-20",
                )}
                aria-label={`${isRtl ? "الانتقال للشريحة" : "Go to slide"} ${index + 1}`}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate px-1">
                      {isRtl ? product.nameAr : product.nameEn}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute inset-0 ring-1 ring-inset ring-yellow-500/30" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Dots fallback for mobile ──────────────── */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2 md:hidden">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "w-6 bg-yellow-500"
                  : "w-1.5 bg-white/30 hover:bg-white/50",
              )}
              aria-label={`${isRtl ? "الانتقال للشريحة" : "Go to slide"} ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
