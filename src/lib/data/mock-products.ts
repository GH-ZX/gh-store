/**
 * Mock products — previously used for development fallback.
 *
 * Now acts as a compatibility layer. The real data comes from Supabase
 * via ProductService / use-products hooks.
 *
 * Re-exports the StoreProduct type so components that import
 * MockProduct still work without changes.
 *
 * @deprecated Use `StoreProduct` from `@/hooks/use-products` or
 * `StoreProduct` from `@/lib/services/product.service` instead.
 */

import type { StoreProduct, StoreCategory } from "@/hooks/use-products";

// Re-export compatibility aliases
export type MockProduct = StoreProduct;
export type MockCategory = StoreCategory;

// Empty arrays — real data comes from Supabase
export const mockProducts: MockProduct[] = [];
export const mockCategories: MockCategory[] = [];
