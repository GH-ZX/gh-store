import { BaseProvider } from "../base-provider";
import type {
  ProviderInfo,
  ProviderTestResult,
  SyncResult,
  OrderResult,
  OrderStatusResult,
  ProviderBalance,
  SyncedProduct,
} from "../types";
import {
  G2BULK_API_BASE,
  type G2BulkUser,
  type G2BulkCategory,
  type G2BulkProduct,
  type G2BulkGame,
  type G2BulkCatalogueItem,
  type G2BulkPurchaseResponse,
  type G2BulkTopupResponse,
  type G2BulkDeliveryResponse,
} from "./types";

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

  constructor(info: ProviderInfo) {
    super(info);
    this.apiKey = this.resolveApiKey();
    this.baseUrl = G2BULK_API_BASE;
  }

  // ─── Auth ───────────────────────────────────────────

  /**
   * Resolve the API key from env vars or credentials.
   * Priority: env var > database credentials > empty
   */
  private resolveApiKey(): string {
    return process.env.G2BULK_API_KEY || "";
  }

  /**
   * Make an authenticated request to the G2Bulk API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `G2Bulk API error (${response.status}): ${errorBody || response.statusText}`,
      );
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

  async syncCatalog(): Promise<SyncResult> {
    const startedAt = new Date().toISOString();
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let deactivated = 0;

    try {
      // Step 1: Fetch products (voucher codes / gift cards)
      try {
        const products = await this.request<G2BulkProduct[]>("/products");
        for (const product of products) {
          // Map to SyncedProduct and upsert into DB
          // TODO: Implement DB upsert in a separate sync service
          console.log(`Product: ${product.title} ($${product.unit_price})`);
        }
        created += products.length;
      } catch (err) {
        errors.push(`Products sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      // Step 2: Fetch games (top-ups)
      try {
        const games = await this.request<G2BulkGame[]>("/games");
        for (const game of games) {
          // Fetch catalogue for each game
          const catalogue = await this.request<G2BulkCatalogueItem[]>(
            `/games/${game.code}/catalogue`,
          );
          console.log(`Game: ${game.name} (${catalogue.length} items)`);
        }
        created += games.length;
      } catch (err) {
        errors.push(`Games sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    } catch (err) {
      errors.push(`Catalog sync error: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    return {
      status: errors.length > 0 && created === 0 ? "failed" : errors.length > 0 ? "partial" : "completed",
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
  private async purchaseVoucher(
    productId: string,
    quantity: number,
  ): Promise<OrderResult> {
    try {
      const data = await this.request<G2BulkPurchaseResponse>(
        `/products/${productId}/purchase`,
        {
          method: "POST",
          body: JSON.stringify({ quantity }),
        },
      );

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
      const data = await this.request<G2BulkTopupResponse>(
        `/games/${gameCode}/order`,
        {
          method: "POST",
          body: JSON.stringify({
            catalogue_name: fields?.catalogue_name || "",
            player_id: fields?.player_id || fields?.uid || "",
            server_id: fields?.server_id,
            charname: fields?.charname,
            remark: fields?.remark,
            callback_url: callbackUrl,
          }),
        },
      );

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
