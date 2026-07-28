import type { StoreProduct } from "@/hooks/use-products";

/**
 * Maps a StoreProduct to the shape ProductGrid/ProductCard expects.
 * - Converts basePrice → price (ProductCard expects `price` not `basePrice`)
 */
export function toGridProduct(p: StoreProduct) {
  return {
    id: p.id,
    slug: p.slug,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    imageUrl: p.imageUrl ?? undefined,
    categoryAr: p.categoryAr,
    categoryEn: p.categoryEn,
    price: p.basePrice,
    originalPrice: p.originalPrice,
    rating: p.rating,
    isActive: p.isActive,
  };
}
