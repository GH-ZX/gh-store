export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GH-Store";
export const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "ar") as Locale;
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";
export const SUPPORTED_LOCALES = ["ar", "en"] as const;

export const PAGINATION_LIMIT = Number(process.env.NEXT_PUBLIC_PAGINATION_LIMIT) || 20;
export const MAX_CART_ITEMS = Number(process.env.NEXT_PUBLIC_MAX_CART_ITEMS) || 50;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "awaiting_payment",
  "paid",
  "fulfilling",
  "completed",
  "refunded",
  "partially_refunded",
  "cancelled",
  "failed",
] as const;

export const PRODUCT_TYPES = [
  "topup",
  "gift_card",
  "redeem_code",
  "license",
  "vpn",
  "streaming",
  "ai_subscription",
  "game_account",
  "digital_product",
] as const;
