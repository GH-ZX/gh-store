"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryNav } from "@/components/store/category-nav";
import { ProductGrid } from "@/components/store/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MockProduct, MockCategory } from "@/lib/data/mock-products";
import { toGridProduct } from "@/lib/data/to-grid-product";
import { cn } from "@/lib/utils";

interface StoreClientProps {
  locale: string;
  isRtl: boolean;
  initialProducts: MockProduct[];
  initialCategories: MockCategory[];
  initialSearchQuery?: string;
  initialType?: string;
}

const ITEMS_PER_PAGE = 12;

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rating-desc";

export function StoreClient({ locale, isRtl, initialProducts, initialCategories, initialSearchQuery = "", initialType }: StoreClientProps) {
  // ─── State ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Filtering & Sorting ────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    // Category filter
    if (activeCategory) {
      list = list.filter((p) => p.categorySlug === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nameAr.includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.categoryAr.includes(q) ||
          p.categoryEn.toLowerCase().includes(q) ||
          p.descriptionAr?.includes(q) ||
          p.descriptionEn?.toLowerCase().includes(q),
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "name-asc":
        list.sort((a, b) => (isRtl ? a.nameAr.localeCompare(b.nameAr) : a.nameEn.localeCompare(b.nameEn)));
        break;
      case "name-desc":
        list.sort((a, b) => (isRtl ? b.nameAr.localeCompare(a.nameAr) : b.nameEn.localeCompare(a.nameEn)));
        break;
      case "rating-desc":
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
    }

    return list;
  }, [initialProducts, activeCategory, searchQuery, sortBy, isRtl]);

  // ─── Pagination ─────────────────────────────────────
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  const handleCategoryChange = useCallback((slug: string | undefined) => {
    setActiveCategory(slug);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory(undefined);
    setSortBy("default");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || activeCategory || sortBy !== "default";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* ─── Page Header ──────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isRtl ? "المتجر" : "Store"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRtl
              ? `تصفح ${filteredProducts.length} منتج من أفضل العروض`
              : `Browse ${filteredProducts.length} products from top deals`}
          </p>
        </div>

        {/* ─── Search + Sort Bar ────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={isRtl ? "ابحث عن منتج..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Sort + Filter toggle */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => { if (v) { setSortBy(v as SortOption); setCurrentPage(1); }}}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="size-3.5 mr-2" />
                <SelectValue placeholder={isRtl ? "ترتيب" : "Sort"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{isRtl ? "افتراضي" : "Default"}</SelectItem>
                <SelectItem value="price-asc">{isRtl ? "السعر: من الأقل" : "Price: Low to High"}</SelectItem>
                <SelectItem value="price-desc">{isRtl ? "السعر: من الأعلى" : "Price: High to Low"}</SelectItem>
                <SelectItem value="name-asc">{isRtl ? "الاسم: أ-ي" : "Name: A-Z"}</SelectItem>
                <SelectItem value="name-desc">{isRtl ? "الاسم: ي-أ" : "Name: Z-A"}</SelectItem>
                <SelectItem value="rating-desc">{isRtl ? "التقييم" : "Top Rated"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {isRtl ? "مسح" : "Clear"}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Category Pills ───────────────────────── */}
        <div className="mb-8">
          <CategoryNav
            categories={initialCategories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* ─── Results ──────────────────────────────── */}
        {filteredProducts.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon="Search"
              title={isRtl ? "لا توجد نتائج" : "No results found"}
              description={
                isRtl
                  ? "لم نتمكن من العثور على منتجات تطابق بحثك. جرب كلمات مختلفة."
                  : "We couldn't find products matching your search. Try different keywords."
              }
              action={{ label: isRtl ? "مسح الفلترة" : "Clear Filters", onClick: clearFilters }}
            />
          </div>
        ) : (
          <>
            <ProductGrid
              products={paginatedProducts.map(toGridProduct)}
              columns={4}
            />

            {/* ─── Pagination ───────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {isRtl ? "السابق" : "Previous"}
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className="min-w-[2.25rem]"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {isRtl ? "التالي" : "Next"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
