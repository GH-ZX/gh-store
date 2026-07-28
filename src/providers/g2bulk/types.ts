/**
 * G2Bulk API — request/response types.
 * Based on https://api.g2bulk.com/v1/ documentation.
 */

/** G2Bulk API base URL */
export const G2BULK_API_BASE = "https://api.g2bulk.com/v1";

/** G2Bulk API error response */
export interface G2BulkError {
  success: false;
  message: string;
  code?: string;
}

/** GET /v1/getMe — user info + balance */
export interface G2BulkUser {
  success: boolean;
  user_id: number;
  username: string;
  first_name: string;
  balance: number;
}

/** GET /v1/category — category list */
export interface G2BulkCategory {
  id: number;
  name: string;
  description?: string;
}

/** GET /v1/products — product list */
// The G2Bulk API returns 'title', 'unit_price', and 'category_title' —
// not 'name', 'price', or 'category_name'.
export interface G2BulkProduct {
  id: number;
  /** API field: title — used as product name */
  title: string;
  description?: string;
  category_id: number;
  /** API field: category_title */
  category_title?: string;
  /** API field: unit_price */
  unit_price: number;
  face_value?: number;
  stock: number;
  /** API field: is_active (not always present) */
  is_active?: boolean;
  image?: string;
}

/** GET /v1/games — game list for top-ups */
export interface G2BulkGame {
  code: string;
  name: string;
  description?: string;
  image_url?: string;
  region?: string;
}

/** GET /v1/games/{code}/catalogue — game denominations */
export interface G2BulkCatalogueItem {
  id: number;
  name: string;
  amount: number;
}

/** POST /v1/products/{id}/purchase — voucher order request */
export interface G2BulkPurchaseRequest {
  quantity: number;
}

/** POST /v1/products/{id}/purchase — voucher order response */
export interface G2BulkPurchaseResponse {
  success: boolean;
  order_id: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  delivery_items?: Array<{
    code: string;
    value?: string;
  }>;
  poll_url?: string;
}

/** POST /v1/games/{code}/order — top-up order request */
export interface G2BulkTopupRequest {
  catalogue_name: string;
  player_id: string;
  server_id?: string;
  charname?: string;
  remark?: string;
  callback_url?: string;
}

/** POST /v1/games/{code}/order — top-up order response */
export interface G2BulkTopupResponse {
  success: boolean;
  order_id: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  message?: string;
}

/** GET /v1/orders/{id}/delivery — poll delivery status */
export interface G2BulkDeliveryResponse {
  success: boolean;
  status: "PENDING" | "COMPLETED" | "FAILED" | "GONE";
  delivery_items?: Array<{
    code: string;
    value?: string;
  }>;
}
