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
