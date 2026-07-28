import { createSupabaseAdminClient } from "@/lib/utils/supabase";

/**
 * Known SAM API endpoints (from docs/sam-api.md).
 */
export const SAM_API_BASE = "https://sam-api.pro/api";

/**
 * Ensure the SAM API provider record exists in the `providers` table.
 * Returns the provider UUID.
 */
export async function ensureSAMProvider(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", "sam-api")
    .single();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("providers")
    .insert({
      name: "SAM API",
      slug: "sam-api",
      type: "payment",
      description: "Payment processing via ShamCash and Syriatel Cash wallets",
      is_active: true,
    })
    .select("id")
    .single();

  if (!created) throw new Error("Failed to create SAM API provider record");
  return created.id;
}

export interface SamReceivingWallet {
  method: "shamcash" | "syriatel";
  identifier: string;
}

export interface SamInvoice {
  invoiceId: string;
  paymentUrl: string;
}

/**
 * Resolve the merchant wallet that customer payments are collected into,
 * as configured by an admin under SAM settings → default wallet.
 */
export async function resolveSAMReceivingWallet(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<SamReceivingWallet | null> {
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", "sam-api")
    .maybeSingle();

  if (!provider) return null;

  const { data: providerConfig } = await supabase
    .from("provider_config")
    .select("value")
    .eq("provider_id", provider.id)
    .eq("key", "payment_config")
    .maybeSingle();

  const config = (providerConfig?.value ?? {}) as Record<string, unknown>;
  const defaultWalletId = String(config.defaultWalletId || "");
  if (!defaultWalletId) return null;

  const { data: wallet } = await supabase
    .from("sam_wallets")
    .select("provider, wallet_address, phone, cash_code")
    .eq("id", defaultWalletId)
    .maybeSingle();

  if (!wallet) return null;

  const identifier = String(wallet.wallet_address || wallet.phone || wallet.cash_code || "");
  if (!identifier) return null;

  return {
    method: wallet.provider === "syriatel" ? "syriatel" : "shamcash",
    identifier,
  };
}

/**
 * Build the webhook URL SAM calls back on. The token authenticates the
 * callback, so this value must never be returned to a non-admin caller.
 */
export async function resolveSAMWebhookUrl(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl) return "";

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", "sam-api")
    .maybeSingle();

  if (!provider) return "";

  const { data: secret } = await supabase
    .from("provider_credentials")
    .select("value")
    .eq("provider_id", provider.id)
    .eq("key", "webhook_secret")
    .eq("is_active", true)
    .maybeSingle();

  if (!secret?.value) return "";

  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/functions/v1/sam-api?token=${encodeURIComponent(String(secret.value))}`;
}

/**
 * Create a SAM payment invoice. Used by both order checkout and wallet
 * top-ups, so the two paths cannot drift apart.
 *
 * Throws on upstream failure; the caller decides how to compensate.
 */
export async function createSAMInvoice(params: {
  apiKey: string;
  wallet: SamReceivingWallet;
  amount: number;
  currency?: string;
  webhookUrl?: string;
}): Promise<SamInvoice> {
  const payload: Record<string, string> = {
    method: params.wallet.method,
    identifier: params.wallet.identifier,
    amount: String(params.amount),
    currency: params.currency ?? "USD",
  };

  if (params.webhookUrl) payload.webhookUrl = params.webhookUrl;

  const res = await fetch(`${SAM_API_BASE}/v1/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Logged server-side only — upstream errors can carry account details.
    console.error("SAM invoice creation failed:", res.status, data);
    throw new Error("Payment provider rejected the request");
  }

  return {
    invoiceId: String(data.invoiceId || ""),
    paymentUrl: String(data.paymentUrl || ""),
  };
}

/**
 * Resolve the SAM API key from the provider_credentials table.
 * The key is stored in Supabase by the admin via the dashboard settings.
 *
 * Returns null if no key is configured.
 */
export async function resolveSAMApiKey(): Promise<string | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", "sam-api")
      .single();

    if (provider) {
      const { data: cred } = await supabase
        .from("provider_credentials")
        .select("value")
        .eq("provider_id", provider.id)
        .eq("key", "api_key")
        .eq("is_active", true)
        .maybeSingle();

      if (cred?.value) return cred.value;
    }
  } catch (err) {
    console.error("Failed to resolve SAM API key from DB:", err);
  }

  return null;
}
