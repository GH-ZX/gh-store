"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Gamepad2, Gift } from "lucide-react";
import { HeroCarousel } from "@/components/store/hero-carousel";
import { QuickActions } from "@/components/store/quick-actions";
import { GiftCardScroller } from "@/components/store/gift-card-scroller";
import { ProductSection } from "@/components/store/product-section";
import { EmptyState } from "@/components/shared/empty-state";
import { useProducts, useFeaturedProducts, useCategories } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoreProduct, StoreCategory } from "@/hooks/use-products";

interface HomepageClientProps {
  locale: string;
  isRtl: boolean;
  initialFeatured: StoreProduct[];
  initialCategories: StoreCategory[];
  initialProducts: StoreProduct[];
}

export function HomepageClient({
  locale,
  isRtl,
  initialFeatured,
  initialCategories,
  initialProducts,
}: HomepageClientProps) {
  const { data: featuredData } = useFeaturedProducts();
  const { data: categoriesData } = useCategories();
  const { data: allProductsData, isLoading: allLoading } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string | undefined>();

  // Server data fallback for SSR hydration
  const featuredProducts =
    featuredData && featuredData.length > 0 ? featuredData : initialFeatured;

  const categories =
    categoriesData && categoriesData.length > 0 ? categoriesData : initialCategories;

  // Use server-fetched products immediately, then upgrade to client-fetched when ready
  const allProducts = allProductsData && allProductsData.length > 0
    ? allProductsData
    : initialProducts.length > 0
      ? initialProducts
      : undefined;

  // ─── Carousel ────────────────────────────────────
  const carouselProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 5)
      : allProducts
        ? allProducts.slice(0, 5)
        : initialFeatured.length > 0
          ? initialFeatured.slice(0, 5)
          : [];

  // ─── Split products by type ──────────────────────
  const globalList = useMemo(
    () => allProducts ?? [],
    [allProducts],
  );

  // Voucher/GiftCard products — shown in "All Products" section
  const voucherProducts = useMemo(() => {
    let list = globalList.filter((p) => p.type !== "topup");
    if (activeCategory) {
      list = list.filter((p) => p.categorySlug === activeCategory);
    }
    return list.slice(0, 12);
  }, [globalList, activeCategory]);

  // Game/Topup products — shown in "Top-Up Games" section
  const gameProducts = useMemo(() => {
    const list = globalList.filter((p) => p.type === "topup");
    return list.slice(0, 8);
  }, [globalList]);

  // Counts
  const voucherCount = globalList.filter((p) => p.type !== "topup").length;
  const gameCount = globalList.filter((p) => p.type === "topup").length;
  const hasAnyProducts = voucherCount > 0 || gameCount > 0;

  const isLoading = allLoading && !allProducts && !hasAnyProducts;

  return (
    <main className="min-h-screen">
      {/* ─── Hero Carousel ─────────────────────────── */}
      {carouselProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 pb-6 md:pt-12 md:pb-8">
          <HeroCarousel products={carouselProducts} />

          {/* Quick action buttons below carousel */}
          <div className="mt-4 sm:mt-6">
            <QuickActions games={gameProducts.length > 0 ? globalList.filter((p) => p.type === "topup") : []} isRtl={isRtl} />
          </div>
        </section>
      )}

      {/* ─── Vouchers & Gift Cards Section ─────────── */}
      {voucherCount > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 space-y-6">
            {/* Section header with gift icon */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Gift className="size-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {isRtl ? "بطاقات الهدايا والقسائم" : "Gift Cards & Vouchers"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRtl
                    ? `${voucherCount} بطاقة رقمية من أشهر المتاجر والمنصات`
                    : `${voucherCount} digital gift cards from top stores and platforms`}
                </p>
              </div>
            </div>

            <ProductSection
              titleAr=""
              titleEn=""
              products={voucherProducts}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              isLoading={isLoading}
              viewAllHref={`/${locale}/store`}
              hideHeader
            />
          </div>
        </section>
      )}

      {/* ─── Gift Card Scroller ──────────────────── */}
      {voucherCount > 0 && (
        <section className="py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4">
            <GiftCardScroller vouchers={globalList.filter((p) => p.type !== "topup")} isRtl={isRtl} />
          </div>
        </section>
      )}

      {/* ─── Top-Up Games Section ──────────────────── */}
      {gameCount > 0 && (
        <section className="pb-12 md:pb-16">
          <div className="mx-auto max-w-7xl px-4 space-y-6">
            {/* Section header with gamepad icon */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Gamepad2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {isRtl ? "توب أب الألعاب" : "Top-Up Games"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRtl
                        ? `${gameCount} لعبة متاحة للشحن — أسعار تبدأ من $`
                        : `${gameCount} games ready to top up — prices start at $`}
                      {gameProducts.length > 0 && (
                        <span className="font-semibold text-foreground">
                          {Math.min(...gameProducts.map((g) => g.basePrice)).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/store?type=topup`}
                    className="text-sm font-medium text-primary hover:underline shrink-0"
                  >
                    {isRtl ? "عرض الكل" : "View All"} →
                  </Link>
                </div>
              </div>
            </div>

            {/* Game cards grid */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {gameProducts.map((game) => {
                const gameMeta = game.metadata as Record<string, unknown> | undefined;
                const catalogue = (gameMeta?.catalogue as Array<{ name: string; amount: number }> | undefined) ?? [];
                const sorted = [...catalogue].sort((a, b) => a.amount - b.amount);
                const minPrice = sorted.length > 0 ? sorted[0].amount : game.basePrice;
                const maxPrice = sorted.length > 0 ? sorted[sorted.length - 1].amount : game.basePrice;

                return (
                  <Link
                    key={game.id}
                    href={`/${locale}/store/${game.slug}`}
                    className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {/* Game image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                      {game.imageUrl ? (
                        <img
                          src={game.imageUrl}
                          alt={isRtl ? game.nameAr : game.nameEn}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="size-12 text-muted-foreground/20" />
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-semibold">
                          From ${minPrice.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3 space-y-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                        {isRtl ? game.nameAr : game.nameEn}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {sorted.length > 0
                          ? isRtl
                            ? `${sorted.length} خيار · $${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`
                            : `${sorted.length} options · $${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`
                          : isRtl
                            ? "بدءاً من $" + minPrice.toFixed(2)
                            : "From $" + minPrice.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Empty State ─────────────────────────────── */}
      {!isLoading && !hasAnyProducts && (
        <section className="py-20">
          <EmptyState
            icon="ShoppingBag"
            title={isRtl ? "لا توجد منتجات" : "No products yet"}
            description={isRtl
              ? "لم تتم مزامنة أي منتجات بعد. قم بمزامنة المنتجات من لوحة التحكم أولاً."
              : "No products have been synced yet. Sync products from the dashboard first."}
          />
        </section>
      )}

      {/* ─── Why GH-Store Features ──────────────────── */}
      <section className="border-t bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              {isRtl ? "لماذا GH-Store؟" : "Why GH-Store?"}
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {isRtl
                ? "منصتك الموثوقة للمنتجات الرقمية بأفضل الأسعار"
                : "Your trusted platform for digital products at the best prices"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold">
                  {isRtl ? feature.titleAr : feature.titleEn}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isRtl ? feature.descAr : feature.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  { icon: "⚡", titleAr: "توصيل فوري", titleEn: "Instant Delivery", descAr: "احصل على منتجاتك الرقمية فورًا بعد الدفع", descEn: "Receive your digital products instantly after payment" },
  { icon: "🔒", titleAr: "دفع آمن", titleEn: "Secure Payment", descAr: "بوابات دفع موثوقة ومشفرة بالكامل", descEn: "Trusted, fully encrypted payment gateways" },
  { icon: "🎮", titleAr: "آلاف المنتجات", titleEn: "Thousands of Products", descAr: "أكبر تشكيلة من التوب أب والبطاقات الرقمية", descEn: "The largest selection of top-ups and digital cards" },
  { icon: "💬", titleAr: "دعم متواصل", titleEn: "24/7 Support", descAr: "فريق دعم جاهز لمساعدتك في أي وقت", descEn: "Support team ready to help you anytime" },
  { icon: "🏷️", titleAr: "أفضل الأسعار", titleEn: "Best Prices", descAr: "أسعار تنافسية مع تحديث يومي", descEn: "Competitive prices updated daily" },
  { icon: "🌐", titleAr: "منتجات عالمية", titleEn: "Global Products", descAr: "منتجات رقمية من جميع أنحاء العالم", descEn: "Digital products from around the world" },
];
