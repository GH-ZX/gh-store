"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryNav } from "@/components/store/category-nav";
import { ProductGrid } from "@/components/store/product-grid";
import { Button } from "@/components/ui/button";
import type { MockProduct, MockCategory } from "@/lib/data/mock-products";
import { toGridProduct } from "@/lib/data/to-grid-product";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
  titleAr: string;
  titleEn: string;
  products: MockProduct[];
  categories?: MockCategory[];
  activeCategory?: string;
  onCategoryChange?: (slug: string | undefined) => void;
  isLoading?: boolean;
  viewAllHref?: string;
  className?: string;
  /** When true, hides the default header (title + subtitle + viewAll). Useful when the parent renders its own header. */
  hideHeader?: boolean;
}

export function ProductSection({
  titleAr,
  titleEn,
  products,
  categories,
  activeCategory,
  onCategoryChange,
  isLoading,
  viewAllHref,
  className,
  hideHeader,
}: ProductSectionProps) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";
  const title = isRtl ? titleAr : titleEn;

  return (
    <section className={cn("space-y-6", className)}>
      {/* Section header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground text-sm">
              {isRtl
                ? `تسوق ${products.length}+ منتج من أفضل الخيارات`
                : `Browse ${products.length}+ products from top picks`}
            </p>
          </div>

          {viewAllHref && (
            <Link href={viewAllHref}>
              <Button variant="ghost" size="sm" className="gap-1">
                {isRtl ? "عرض الكل" : "View All"}
                {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Category navigation */}
      {categories && categories.length > 0 && (
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />
      )}

      {/* Product grid */}
      {!isLoading && products.length === 0 ? (
        <EmptyState
          icon="Package"
          title={isRtl ? "لا توجد منتجات" : "No products found"}
          description={
            isRtl
              ? "لم نتمكن من العثور على منتجات في هذا القسم"
              : "We couldn't find any products in this section"
          }
        />
      ) : (
        <ProductGrid products={products.map(toGridProduct)} isLoading={isLoading} columns={4} />
      )}
    </section>
  );
}
