import { createSupabaseServerClient } from "@/lib/utils/supabase";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/** Product shape returned to the storefront */
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

/**
 * Maps a DB product row to the StoreProduct shape.
 * Extracts dynamic fields and metadata from the JSONB `metadata` column.
 */
function toStoreProduct(p: ProductRow, cat?: CategoryRow | null): StoreProduct {
  // Extract fields from metadata (stored by G2Bulk sync for topup/gift_card products)
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
    // Pass through raw metadata for frontend to use (catalogue, amounts, game info)
    metadata: meta || undefined,
  };
}

/**
 * ProductService — server-side product queries.
 * Uses Supabase exclusively. Returns empty arrays when no data exists.
 */
export class ProductService {
  /**
   * Fetch all active products, optionally filtered by category.
   */
  static async getProducts(options?: {
    categorySlug?: string;
    limit?: number;
  }): Promise<StoreProduct[]> {
    try {
      const supabase = await createSupabaseServerClient();

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
        console.error("ProductService.getProducts error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((p) => {
        const cat = (p as any).categories as CategoryRow | undefined;
        return toStoreProduct(p, cat ?? null);
      });
    } catch (err) {
      console.error("ProductService.getProducts exception:", err);
      return [];
    }
  }

  /**
   * Fetch a single product by slug.
   */
  static async getProductBySlug(slug: string): Promise<StoreProduct | null> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(slug, name_ar, name_en)")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("ProductService.getProductBySlug error:", error.message);
        return null;
      }

      if (!data) return null;

      const cat = (data as any).categories as CategoryRow | undefined;
      return toStoreProduct(data, cat ?? null);
    } catch (err) {
      console.error("ProductService.getProductBySlug exception:", err);
      return null;
    }
  }

  /**
   * Fetch featured products for the homepage carousel.
   */
  static async getFeaturedProducts(): Promise<StoreProduct[]> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("products")
        .select("*, categories!inner(slug, name_ar, name_en)")
        .eq("is_featured", true)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .limit(8);

      if (error) {
        console.error("ProductService.getFeaturedProducts error:", error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((p) => {
        const cat = (p as any).categories as CategoryRow | undefined;
        return toStoreProduct(p, cat ?? null);
      });
    } catch (err) {
      console.error("ProductService.getFeaturedProducts exception:", err);
      return [];
    }
  }

  /**
   * Fetch all active categories.
   */
  static async getCategories(): Promise<StoreCategory[]> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("ProductService.getCategories error:", error.message);
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
      console.error("ProductService.getCategories exception:", err);
      return [];
    }
  }

  /**
   * Get products grouped by category (for homepage sections).
   */
  static async getProductsByCategory(): Promise<
    { category: StoreCategory; products: StoreProduct[] }[]
  > {
    const categories = await this.getCategories();
    const sections: { category: StoreCategory; products: StoreProduct[] }[] = [];

    for (const category of categories) {
      const products = await this.getProducts({
        categorySlug: category.slug,
        limit: 4,
      });
      if (products.length > 0) {
        sections.push({ category, products });
      }
    }

    return sections;
  }
}
