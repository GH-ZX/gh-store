import type {
  ProviderInfo,
  ProviderTestResult,
  SyncResult,
  OrderResult,
  OrderStatusResult,
  ProviderBalance,
} from "./types";

/**
 * Abstract base class for all provider adapters.
 *
 * Every external service (G2Bulk, SAM, VPN suppliers, etc.) must
 * implement this interface. The registry manages instances.
 *
 * Guidelines:
 * - Never expose provider credentials to the client
 * - All API calls go through server-side code
 * - Sync operations are idempotent
 * - Errors should be descriptive and logged
 */
export abstract class BaseProvider {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;

  constructor(info: ProviderInfo) {
    this.id = info.id;
    this.name = info.name;
    this.slug = info.slug;
  }

  // ─── Required Methods ──────────────────────────────

  /** Get provider metadata and status */
  abstract getInfo(): Promise<ProviderInfo>;

  /** Test connection to the provider (e.g. check API key validity) */
  abstract testConnection(): Promise<ProviderTestResult>;

  /** Get current wallet/account balance from the provider */
  abstract getBalance(): Promise<ProviderBalance>;

  /**
   * Sync products from the provider into the local database.
   * Should be idempotent — products are created/updated/deactivated.
   */
  abstract syncCatalog(): Promise<SyncResult>;

  /**
   * Place an order with the provider.
   */
  abstract placeOrder(params: {
    productId: string;
    quantity: number;
    fields?: Record<string, string>;
    callbackUrl?: string;
  }): Promise<OrderResult>;

  /**
   * Check the status of an order.
   */
  abstract checkOrderStatus(providerOrderId: string): Promise<OrderStatusResult>;

  // ─── Optional Methods (override as needed) ─────────

  /** Cancel an order if supported */
  cancelOrder?(providerOrderId: string): Promise<{ success: boolean; message?: string }>;

  /** Get provider-specific metadata */
  getMetadata?(): Record<string, unknown>;
}
