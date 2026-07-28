import type { StoreProduct } from "@/hooks/use-products";

/**
 * Maps a StoreProduct to the shape ProductGrid/ProductCard expects.
 * - Converts basePrice → price (ProductCard expects `price` not `basePrice`)
 * - Flags products that cannot be added straight to the cart, because the
 *   buyer must first pick a variant or fill in required fields
 */
export function toGridProduct(p: StoreProduct) {
  const metadata = (p.metadata ?? {}) as Record<string, unknown>;
  const hasVariants =
    (Array.isArray(metadata.amounts) && metadata.amounts.length > 0) ||
    (Array.isArray(metadata.catalogue) && metadata.catalogue.length > 0);
  const hasRequiredFields = (p.fields ?? []).some((f) => f.required);

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
    requiresSelection: hasVariants || hasRequiredFields,
  };
}
