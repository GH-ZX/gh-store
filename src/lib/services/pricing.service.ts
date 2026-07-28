import { createSupabaseAdminClient } from "@/lib/utils/supabase";

/**
 * Server-side price resolution.
 *
 * Prices must never be taken from the request body. The client sends only
 * *what* it wants (product id, variant id, quantity); this module decides what
 * that costs by reading `products` from the database.
 */

export interface RequestedItem {
  productId: string;
  quantity: number;
  /** Gift-card amount id or top-up catalogue item id, when the product has variants. */
  variantId?: string | null;
  fields?: Record<string, unknown>;
}

export interface PricedItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantId: string | null;
  variantLabel: string | null;
  fields: Record<string, unknown>;
}

export interface PricedOrder {
  items: PricedItem[];
  subtotal: number;
  total: number;
}

export type PricingError = { error: string };

interface AmountOption {
  id: string | number;
  title?: string;
  unit_price: number;
}

interface CatalogueOption {
  id: string | number;
  name?: string;
  amount: number;
}

/** Round to 2 decimals without float drift (e.g. 0.1 + 0.2 → 0.3). */
function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resolve the authoritative unit price for one line item.
 *
 * Mirrors the selection logic in `product-detail-client.tsx`: gift cards price
 * from `metadata.amounts[].unit_price`, top-ups from `metadata.catalogue[].amount`,
 * everything else from `base_price`.
 */
function resolveUnitPrice(
  product: {
    type: string;
    base_price: number | string;
    name_en: string;
    metadata: Record<string, unknown> | null;
  },
  variantId: string | null,
): { unitPrice: number; variantLabel: string | null } | PricingError {
  const basePrice = Number(product.base_price);
  const metadata = product.metadata ?? {};

  if (product.type === "gift_card" && Array.isArray(metadata.amounts)) {
    const amounts = metadata.amounts as AmountOption[];
    if (amounts.length > 0) {
      if (!variantId) return { error: `Select an amount for "${product.name_en}"` };
      const match = amounts.find((a) => String(a.id) === variantId);
      if (!match) return { error: `Invalid amount selected for "${product.name_en}"` };
      return { unitPrice: Number(match.unit_price), variantLabel: match.title ?? null };
    }
  }

  if (product.type === "topup" && Array.isArray(metadata.catalogue)) {
    const catalogue = metadata.catalogue as CatalogueOption[];
    if (catalogue.length > 0) {
      if (!variantId) return { error: `Select an option for "${product.name_en}"` };
      const match = catalogue.find((c) => String(c.id) === variantId);
      if (!match) return { error: `Invalid option selected for "${product.name_en}"` };
      return { unitPrice: Number(match.amount), variantLabel: match.name ?? null };
    }
  }

  return { unitPrice: basePrice, variantLabel: null };
}

/**
 * Price a cart server-side.
 *
 * Verifies every product exists and is purchasable, then computes each line
 * total and the order total from database values only. Returns `{ error }`
 * rather than throwing so route handlers can map it straight to a 400.
 */
export async function priceOrder(
  items: RequestedItem[],
): Promise<PricedOrder | PricingError> {
  if (items.length === 0) return { error: "Cart is empty" };

  const supabase = createSupabaseAdminClient();
  const productIds = [...new Set(items.map((i) => i.productId))];

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name_ar, name_en, type, base_price, status, metadata")
    .in("id", productIds);

  if (error) {
    console.error("priceOrder: failed to load products:", error.message);
    return { error: "Failed to verify product pricing" };
  }

  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

  const priced: PricedItem[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);

    // A product the caller invented, or one that was deleted mid-checkout.
    if (!product) return { error: "One or more products are no longer available" };

    if (product.status !== "active") {
      return { error: `"${product.name_en}" is not available for purchase` };
    }

    const resolved = resolveUnitPrice(
      product as Parameters<typeof resolveUnitPrice>[0],
      item.variantId ?? null,
    );
    if ("error" in resolved) return resolved;

    if (!Number.isFinite(resolved.unitPrice) || resolved.unitPrice < 0) {
      return { error: `Invalid price configured for "${product.name_en}"` };
    }

    const unitPrice = money(resolved.unitPrice);

    priced.push({
      productId: product.id as string,
      name: product.name_en as string,
      quantity: item.quantity,
      unitPrice,
      totalPrice: money(unitPrice * item.quantity),
      variantId: item.variantId ?? null,
      variantLabel: resolved.variantLabel,
      fields: item.fields ?? {},
    });
  }

  const subtotal = money(priced.reduce((sum, i) => sum + i.totalPrice, 0));

  if (subtotal <= 0) return { error: "Order total must be greater than zero" };

  return { items: priced, subtotal, total: subtotal };
}
