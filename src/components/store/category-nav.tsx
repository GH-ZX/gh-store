"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Category {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
}

interface CategoryNavProps {
  categories: Category[];
  /** When provided, uses click handlers instead of Link navigation for in-page filtering */
  activeCategory?: string;
  onCategoryChange?: (slug: string | undefined) => void;
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const isRtl = params?.locale === "ar";

  // Determine the active category: from props (filter mode) or URL (navigation mode)
  const isFilterMode = onCategoryChange !== undefined;
  const currentCategory = isFilterMode ? activeCategory : pathname.split("/").pop();

  const handleClick = (slug: string | undefined) => {
    if (isFilterMode && onCategoryChange) {
      onCategoryChange(slug);
    }
  };

  const isActive = (slug?: string) => {
    if (isFilterMode) {
      return slug === currentCategory || (!slug && !currentCategory);
    }
    return slug ? currentCategory === slug : !currentCategory || currentCategory === "store";
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {/* "All" button */}
        {isFilterMode ? (
          <button
            onClick={() => handleClick(undefined)}
            className={cn(
              "hover:bg-accent shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              isActive()
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border",
            )}
          >
            {isRtl ? "الكل" : "All"}
          </button>
        ) : (
          <Link
            href={`/${params?.locale || "ar"}/store`}
            className={cn(
              "hover:bg-accent shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              isActive()
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border",
            )}
          >
            {isRtl ? "الكل" : "All"}
          </Link>
        )}

        {categories.map((category) =>
          isFilterMode ? (
            <button
              key={category.slug}
              onClick={() => handleClick(category.slug)}
              className={cn(
                "hover:bg-accent shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive(category.slug)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border",
              )}
            >
              {category.icon && <span className="mr-1 text-base">{category.icon}</span>}
              {isRtl ? category.nameAr : category.nameEn}
            </button>
          ) : (
            <Link
              key={category.slug}
              href={`/${params?.locale || "ar"}/store/${category.slug}`}
              className={cn(
                "hover:bg-accent shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive(category.slug)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border",
              )}
            >
              {category.icon && <span className="mr-1 text-base">{category.icon}</span>}
              {isRtl ? category.nameAr : category.nameEn}
            </Link>
          ),
        )}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
