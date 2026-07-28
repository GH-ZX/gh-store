import { z } from "zod";

/**
 * Runtime validation for provider-facing API route input.
 *
 * Route handlers receive untrusted JSON/query input. Casting with `as` only
 * silences the compiler — these schemas are what actually enforce shape at
 * runtime before anything reaches the DB or an upstream provider.
 */

/** POST /api/g2bulk/settings — and the apiKey branch of POST /api/sam/settings */
export const apiKeySchema = z.object({
  apiKey: z.string().trim().min(8, "API key is too short").max(512),
});

/** POST /api/g2bulk/sync */
export const g2bulkSyncSchema = z
  .object({
    categories: z.array(z.number().int().positive()).max(200).optional(),
    products: z.array(z.number().int().positive()).max(500).optional(),
    games: z.array(z.string().min(1).max(100)).max(200).optional(),
  })
  .refine((v) => Boolean(v.categories?.length || v.products?.length || v.games?.length), {
    message: "Select at least one category, product, or game to sync",
  });

/** Advanced SAM config saved under provider_config.payment_config */
export const samConfigSchema = z.object({
  profitMargin: z.number().min(0).max(100).optional(),
  defaultCurrency: z.enum(["USD", "SYP", "EUR"]).optional(),
  defaultWalletId: z.string().uuid().nullish().or(z.literal("")),
  autoConfirm: z.boolean().optional(),
});

/** POST /api/sam/settings — exactly one of the three branches */
export const samSettingsSchema = z
  .object({
    apiKey: z.string().trim().min(8).max(512).optional(),
    config: samConfigSchema.optional(),
    regenerateWebhook: z.literal(true).optional(),
  })
  .refine((v) => Boolean(v.apiKey || v.config || v.regenerateWebhook), {
    message: "Provide apiKey, config, or regenerateWebhook",
  });

/**
 * GET /api/sam/transactions query params.
 *
 * The identifiers are interpolated into an upstream URL path, so they are
 * restricted to a safe alphabet here in addition to being percent-encoded at
 * the call site — a defence-in-depth pair against path traversal / SSRF.
 */
const upstreamIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Identifier contains unsupported characters");

export const samTransactionsQuerySchema = z
  .object({
    provider: z.enum(["shamcash", "syriatel"]),
    walletAddress: upstreamIdentifier.optional(),
    phone: upstreamIdentifier.optional(),
    cashCode: upstreamIdentifier.optional(),
    direction: z.enum(["all", "in", "out"]).default("all"),
    walletId: z.string().uuid().optional(),
  })
  .refine(
    (v) => (v.provider === "shamcash" ? Boolean(v.walletAddress) : Boolean(v.phone || v.cashCode)),
    { message: "Missing identifier for the selected provider" },
  );

/**
 * POST /api/orders/create
 *
 * Deliberately has no price fields. The client states *what* it wants; the
 * server derives what that costs via `priceOrder()`. Any `unitPrice`/`total`
 * sent by a client is ignored, not trusted.
 */
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
        /** Gift-card amount id or top-up catalogue id, when the product has variants. */
        variantId: z.string().max(128).nullish(),
        fields: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1, "Cart is empty")
    .max(50),
  paymentMethod: z.enum(["wallet", "sam"]),
  notes: z.string().max(1000).nullish(),
});

/** POST /api/wallet/recharge */
export const walletRechargeSchema = z.object({
  amount: z.number().positive().max(100_000),
  method: z.enum(["shamcash", "syriatel"]).optional(),
});

export type G2BulkSyncInput = z.infer<typeof g2bulkSyncSchema>;
export type SamConfigInput = z.infer<typeof samConfigSchema>;
export type SamTransactionsQuery = z.infer<typeof samTransactionsQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type WalletRechargeInput = z.infer<typeof walletRechargeSchema>;
