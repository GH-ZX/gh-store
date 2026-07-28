"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon?: string;
}

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const isRtl = params?.locale === "ar";
  const currentCategory = pathname.split("/").pop();

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <Link
          href={`/${params?.locale || "ar"}/store`}
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
            !currentCategory || currentCategory === "store"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border",
          )}
        >
          {isRtl ? "الكل" : "All"}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/${params?.locale || "ar"}/store/${category.slug}`}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
              currentCategory === category.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border",
            )}
          >
            {category.icon && <span className="text-base">{category.icon}</span>}
            {isRtl ? category.nameAr : category.nameEn}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
