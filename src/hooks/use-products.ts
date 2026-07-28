"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase-client";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/** Product shape for the storefront (matches ProductService) */
export interface StoreProduct {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  categoryId: string;
  categorySlug: string;
  categoryAr: string;
  categoryEn: string;
  type: string;
  basePrice: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  isFeatured: boolean;
  fields?: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  /** Raw metadata from DB (catalogue, amounts, game info for topup/gift_card products) */
  metadata?: Record<string, unknown>;
}

export interface StoreCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
}

function toProduct(p: ProductRow, cat?: CategoryRow | null): StoreProduct {
  const meta = p.metadata as Record<string, unknown> | null;
  const metaFields = meta?.fields as Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    type: string;
    required: boolean;
    options?: string[];
  }> | undefined;

  return {
    id: p.id,
    slug: p.slug,
    nameAr: p.name_ar,
    nameEn: p.name_en,
    descriptionAr: p.description_ar ?? undefined,
    descriptionEn: p.description_en ?? undefined,
    imageUrl: p.image_url ?? undefined,
    categoryId: p.category_id,
    categorySlug: cat?.slug ?? "",
    categoryAr: cat?.name_ar ?? "",
    categoryEn: cat?.name_en ?? "",
    type: p.type,
    basePrice: Number(p.base_price),
    originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
    rating: p.rating != null ? Number(p.rating) : undefined,
    reviewCount: p.review_count != null ? p.review_count : undefined,
    isActive: p.status === "active",
    isFeatured: p.is_featured,
    fields: metaFields,
    metadata: meta || undefined,
  };
}

/**
 * Fetch all active products from Supabase.
 */
async function fetchProducts(options?: {
  categorySlug?: string;
  limit?: number;
}): Promise<StoreProduct[]> {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("products")
      .select("*, categories!inner(slug, name_ar, name_en)")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (options?.categorySlug) {
      query = query.eq("categories.slug", options.categorySlug);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("fetchProducts error:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((p) => {
      const cat = (p as any).categories as CategoryRow | undefined;
      return toProduct(p, cat ?? null);
    });
  } catch (err) {
    console.error("fetchProducts exception:", err);
    return [];
  }
}

/**
 * Fetch featured products.
 */
async function fetchFeaturedProducts(): Promise<StoreProduct[]> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories!inner(slug, name_ar, name_en)")
      .eq("is_featured", true)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(8);

    if (error) {
      console.error("fetchFeaturedProducts error:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((p) => {
      const cat = (p as any).categories as CategoryRow | undefined;
      return toProduct(p, cat ?? null);
    });
  } catch (err) {
    console.error("fetchFeaturedProducts exception:", err);
    return [];
  }
}

/**
 * Fetch product by slug.
 */
async function fetchProductBySlug(
  slug: string,
): Promise<StoreProduct | null> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug, name_ar, name_en)")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("fetchProductBySlug error:", error.message);
      return null;
    }

    if (!data) return null;

    const cat = (data as any).categories as CategoryRow | undefined;
    return toProduct(data, cat ?? null);
  } catch (err) {
    console.error("fetchProductBySlug exception:", err);
    return null;
  }
}

/**
 * Fetch categories.
 */
async function fetchCategories(): Promise<StoreCategory[]> {
  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("fetchCategories error:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((c) => ({
      id: c.id,
      slug: c.slug,
      nameAr: c.name_ar,
      nameEn: c.name_en,
    }));
  } catch (err) {
    console.error("fetchCategories exception:", err);
    return [];
  }
}

// ─── React Query Hooks ─────────────────────────────────

/**
 * Hook to fetch all active products.
 */
export function useProducts(options?: {
  categorySlug?: string;
  limit?: number;
}) {
  return useQuery<StoreProduct[]>({
    queryKey: ["products", options?.categorySlug, options?.limit],
    queryFn: () => fetchProducts(options),
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch featured products for the homepage carousel.
 */
export function useFeaturedProducts() {
  return useQuery<StoreProduct[]>({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch a single product by slug.
 */
export function useProduct(slug: string) {
  return useQuery<StoreProduct | null>({
    queryKey: ["products", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch all categories.
 */
export function useCategories() {
  return useQuery<StoreCategory[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 300_000,
  });
}
