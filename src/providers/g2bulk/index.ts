import {
  getOrCreateCategory,
  upsertProduct,
  deactivateMissingProducts,
  recordSyncLog,
} from "@/lib/services/g2bulk-sync.service";
import { ensureG2BulkProvider } from "@/lib/services/g2bulk.service";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { BaseProvider } from "../base-provider";
import {
  G2BULK_API_BASE,
  type G2BulkUser,
  type G2BulkProduct,
  type G2BulkGame,
  type G2BulkCatalogueItem,
  type G2BulkPurchaseResponse,
  type G2BulkTopupResponse,
  type G2BulkDeliveryResponse,
} from "./types";
import type {
  ProviderInfo,
  ProviderTestResult,
  SyncResult,
  OrderResult,
  OrderStatusResult,
  ProviderBalance,
} from "../types";

/**
 * G2Bulk Provider Adapter.
 *
 * Implements the BaseProvider interface for the G2Bulk API.
 * Handles:
 * - Catalog sync (products, games, categories)
 * - Voucher/gift card purchases
 * - Game top-up orders
 * - Order status polling
 * - Balance checking
 */
export class G2BulkProvider extends BaseProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(info: ProviderInfo, apiKey?: string) {
    super(info);
    this.apiKey = apiKey || "";
    this.baseUrl = G2BULK_API_BASE;
  }

  /**
   * Make an authenticated request to the G2Bulk API.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`G2Bulk API error (${response.status}): ${errorBody || response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  }

  // ─── BaseProvider Implementation ────────────────────

  async getInfo(): Promise<ProviderInfo> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      type: "hybrid",
      isActive: !!this.apiKey,
      config: { baseUrl: this.baseUrl },
    };
  }

  async testConnection(): Promise<ProviderTestResult> {
    const start = Date.now();

    try {
      const data = await this.request<G2BulkUser>("/getMe");

      return {
        success: true,
        message: `Connected as ${data.first_name} (@${data.username}), balance: $${data.balance}`,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Connection failed",
        latencyMs: Date.now() - start,
      };
    }
  }

  async getBalance(): Promise<ProviderBalance> {
    const data = await this.request<G2BulkUser>("/getMe");

    return {
      balance: data.balance,
      currency: "USD",
      username: data.username,
    };
  }

  /**
   * Sync the full G2Bulk catalogue into Supabase.
   *
   * Voucher categories and games each become ONE product carrying their price
   * options in `metadata` (`amounts` / `catalogue`), which is what
   * `pricing.service.ts` reads to price an order server-side. Products that
   * disappear upstream are deactivated, never deleted — `order_items`
   * references them with ON DELETE RESTRICT.
   */
  async syncCatalog(): Promise<SyncResult> {
    const startedAt = new Date().toISOString();
    const errors: string[] = [];
    const seenSlugs: string[] = [];
    let created = 0;
    let updated = 0;
    let deactivated = 0;

    const supabase = createSupabaseAdminClient();
    const providerId = await ensureG2BulkProvider(supabase);

    // ─── Vouchers, grouped into one product per category ───
    try {
      const result = await this.request<{ products?: G2BulkProduct[] }>("/products");
      const products = result?.products ?? [];

      const byCategory = new Map<number, G2BulkProduct[]>();
      for (const p of products) {
        const catId = Number(p.category_id);
        if (!Number.isFinite(catId)) continue;
        if (!byCategory.has(catId)) byCategory.set(catId, []);
        byCategory.get(catId)!.push(p);
      }

      if (byCategory.size > 0) {
        const storeCat = await getOrCreateCategory(supabase, "vouchers", "قسائم", "Vouchers");

        for (const [catId, group] of byCategory) {
          const slug = `g2bulk-voucher-${catId}`;
          try {
            const amounts = group
              .map((p) => ({
                id: Number(p.id),
                title: String(p.title ?? ""),
                unit_price: Number(p.unit_price ?? 0),
                face_value: p.face_value != null ? Number(p.face_value) : null,
                stock: p.stock != null ? Number(p.stock) : -1,
              }))
              .sort((a, b) => a.unit_price - b.unit_price);

            const minPrice = Math.min(...amounts.map((a) => a.unit_price));
            const maxFaceValue = Math.max(...amounts.map((a) => a.face_value ?? 0), 0);
            const title = String(group[0].category_title || `Category ${catId}`);

            const { created: wasCreated } = await upsertProduct(supabase, slug, {
              slug,
              category_id: storeCat.id,
              provider_id: providerId,
              name_ar: title,
              name_en: title,
              description_ar: `قسائم ${title} — ${amounts.length} فئة سعرية`,
              description_en: `${title} vouchers — ${amounts.length} price options`,
              base_price: minPrice,
              original_price: maxFaceValue > minPrice ? maxFaceValue : null,
              type: "gift_card",
              status: "active",
              provider_product_id: `g2bulk-cat-${catId}`,
              sort_order: catId,
              metadata: { g2bulk_category_id: catId, amounts },
            });

            seenSlugs.push(slug);
            if (wasCreated) created++;
            else updated++;
          } catch (err) {
            errors.push(`Category ${catId}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }
      }
    } catch (err) {
      errors.push(`Products sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    // ─── Games, one product per game with its catalogue ───
    try {
      const result = await this.request<{ games?: G2BulkGame[] }>("/games");
      const games = result?.games ?? [];

      if (games.length > 0) {
        const storeCat = await getOrCreateCategory(supabase, "games", "الألعاب", "Games");

        for (const game of games) {
          const slug = `g2bulk-game-${game.code}`;
          try {
            const catResult = await this.request<{ catalogues?: G2BulkCatalogueItem[] }>(
              `/games/${encodeURIComponent(game.code)}/catalogue`,
            );
            const catalogue = (catResult?.catalogues ?? []).map((item) => ({
              id: Number(item.id),
              name: String(item.name ?? ""),
              amount: Number(item.amount ?? 0),
            }));

            const minPrice = catalogue.length > 0 ? Math.min(...catalogue.map((c) => c.amount)) : 0;

            const { created: wasCreated } = await upsertProduct(supabase, slug, {
              slug,
              category_id: storeCat.id,
              provider_id: providerId,
              name_ar: game.name,
              name_en: game.name,
              description_ar: game.description || `${game.name} — توب أب`,
              description_en: game.description || `${game.name} — Top-Up`,
              image_url: game.image_url || null,
              base_price: minPrice,
              type: "topup",
              status: "active",
              provider_product_id: slug,
              sort_order: 0,
              metadata: {
                game_code: game.code,
                game_name: game.name,
                game_image: game.image_url || null,
                catalogue,
                fields: [
                  {
                    key: "player_id",
                    labelAr: "معرف اللاعب (UID)",
                    labelEn: "Player ID (UID)",
                    type: "text",
                    required: true,
                  },
                  {
                    key: "server_id",
                    labelAr: "الخادم (اختياري)",
                    labelEn: "Server (optional)",
                    type: "text",
                    required: false,
                  },
                  {
                    key: "charname",
                    labelAr: "اسم الشخصية (اختياري)",
                    labelEn: "Character Name (optional)",
                    type: "text",
                    required: false,
                  },
                ],
              },
            });

            seenSlugs.push(slug);
            if (wasCreated) created++;
            else updated++;
          } catch (err) {
            errors.push(`Game ${game.code}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }
      }
    } catch (err) {
      errors.push(`Games sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    // ─── Retire products no longer offered upstream ───
    // Only when at least one item synced — an upstream outage that returns an
    // empty catalogue must not deactivate the entire store.
    if (seenSlugs.length > 0) {
      try {
        deactivated = await deactivateMissingProducts(supabase, providerId, seenSlugs);
      } catch (err) {
        errors.push(`Deactivation failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    const touched = created + updated;
    const status: SyncResult["status"] =
      errors.length > 0 && touched === 0 ? "failed" : errors.length > 0 ? "partial" : "completed";

    await recordSyncLog(supabase, {
      providerId,
      type: "scheduled",
      status,
      productsCreated: created,
      productsUpdated: updated,
      productsDeactivated: deactivated,
      errors,
      startedAt,
    });

    return {
      status,
      productsCreated: created,
      productsUpdated: updated,
      productsDeactivated: deactivated,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  async placeOrder(params: {
    productId: string;
    quantity: number;
    fields?: Record<string, string>;
    callbackUrl?: string;
  }): Promise<OrderResult> {
    // Determine if this is a voucher (product ID is numeric) or game top-up
    if (/^\d+$/.test(params.productId)) {
      return this.purchaseVoucher(params.productId, params.quantity);
    }

    return this.placeTopup(params.productId, params.fields, params.callbackUrl);
  }

  /**
   * Purchase a voucher/gift card product.
   */
  private async purchaseVoucher(productId: string, quantity: number): Promise<OrderResult> {
    try {
      const data = await this.request<G2BulkPurchaseResponse>(`/products/${productId}/purchase`, {
        method: "POST",
        body: JSON.stringify({ quantity }),
      });

      return {
        success: data.success,
        providerOrderId: String(data.order_id),
        status: data.status,
        deliveryItems: data.delivery_items?.map((item) => ({
          type: "code" as const,
          value: item.code,
          label: item.value,
        })),
        message: data.status === "COMPLETED" ? "Delivered" : "Processing",
      };
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        message: err instanceof Error ? err.message : "Purchase failed",
      };
    }
  }

  /**
   * Place a game top-up order.
   */
  private async placeTopup(
    gameCode: string,
    fields?: Record<string, string>,
    callbackUrl?: string,
  ): Promise<OrderResult> {
    try {
      const data = await this.request<G2BulkTopupResponse>(`/games/${gameCode}/order`, {
        method: "POST",
        body: JSON.stringify({
          catalogue_name: fields?.catalogue_name || "",
          player_id: fields?.player_id || fields?.uid || "",
          server_id: fields?.server_id,
          charname: fields?.charname,
          remark: fields?.remark,
          callback_url: callbackUrl,
        }),
      });

      return {
        success: data.success,
        providerOrderId: String(data.order_id),
        status: data.status,
        message: data.message,
      };
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        message: err instanceof Error ? err.message : "Order failed",
      };
    }
  }

  async checkOrderStatus(providerOrderId: string): Promise<OrderStatusResult> {
    try {
      const data = await this.request<G2BulkDeliveryResponse>(
        `/orders/${providerOrderId}/delivery`,
      );

      return {
        status: data.status,
        providerOrderId,
        deliveryItems: data.delivery_items?.map((item) => ({
          type: "code" as const,
          value: item.code,
          label: item.value,
        })),
        isCompleted: data.status === "COMPLETED",
        isFailed: data.status === "FAILED" || data.status === "GONE",
      };
    } catch (err) {
      return {
        status: "FAILED",
        providerOrderId,
        isCompleted: false,
        isFailed: true,
      };
    }
  }

  /**
   * Get the API URL for a poll URL returned by a purchase.
   */
  getPollUrl(pollUrl: string): string {
    return `${this.baseUrl}${pollUrl}`;
  }
}
