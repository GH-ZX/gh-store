/**
 * Shared provider types for the Provider Adapter architecture.
 *
 * Every provider (G2Bulk, SAM API, future providers) implements
 * the BaseProvider interface. The registry manages all providers.
 */

/** Provider capability classification */
export type ProviderType = "product" | "payment" | "fulfillment" | "hybrid";

/** Sync result status */
export type SyncStatus = "running" | "completed" | "failed" | "partial";

/** Provider connection test result */
export interface ProviderTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

/** Provider metadata */
export interface ProviderInfo {
  id: string;
  name: string;
  slug: string;
  type: ProviderType;
  isActive: boolean;
  config?: Record<string, unknown>;
}

/** Product synced from a provider */
export interface SyncedProduct {
  providerProductId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  category: string;
  type: string;
  basePrice: number;
  imageUrl?: string;
  description?: string;
  fields?: SyncedField[];
  metadata?: Record<string, unknown>;
}

/** Dynamic field definition for a product */
export interface SyncedField {
  key: string;
  labelAr: string;
  labelEn: string;
  type: "text" | "number" | "email" | "password" | "select" | "uid" | "server" | "region";
  required: boolean;
  options?: string[];
  placeholderAr?: string;
  placeholderEn?: string;
}

/** Catalog sync result */
export interface SyncResult {
  status: SyncStatus;
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

/** Order placement result */
export interface OrderResult {
  success: boolean;
  providerOrderId?: string;
  status: string;
  deliveryItems?: DeliveryItem[];
  message?: string;
}

/** Delivered item (code, key, URL) */
export interface DeliveryItem {
  type: "code" | "key" | "url" | "text";
  value: string;
  label?: string;
}

/** Order status check result */
export interface OrderStatusResult {
  status: string;
  providerOrderId: string;
  deliveryItems?: DeliveryItem[];
  isCompleted: boolean;
  isFailed: boolean;
}

/** Provider balance info */
export interface ProviderBalance {
  balance: number;
  currency: string;
  username?: string;
}

/** Provider configuration for registration */
export interface ProviderConfig {
  slug: string;
  name: string;
  type: ProviderType;
  description?: string;
  isActive?: boolean;
  credentials?: Record<string, string>;
  config?: Record<string, unknown>;
}
