import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/store/product-card";
import { ProductCardSkeleton } from "@/components/shared/loading";

interface Product {
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
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({
  products,
  isLoading,
  columns = 4,
  className,
}: ProductGridProps) {
  const gridCols = {
    2: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  if (isLoading) {
    return (
      <div className={cn("grid gap-4", gridCols[columns], className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Let parent handle empty state
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
