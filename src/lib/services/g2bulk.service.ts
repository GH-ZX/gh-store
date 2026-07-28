import { createSupabaseAdminClient } from "@/lib/utils/supabase";

/**
 * Ensure the G2Bulk provider record exists in the `providers` table.
 * Returns the provider UUID.
 */
export async function ensureG2BulkProvider(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", "g2bulk")
    .single();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("providers")
    .insert({
      name: "G2Bulk",
      slug: "g2bulk",
      type: "hybrid",
      description: "Game top-ups, gift cards, and digital codes",
      is_active: true,
    })
    .select("id")
    .single();

  if (!created) throw new Error("Failed to create G2Bulk provider record");
  return created.id;
}

/**
 * Resolve the G2Bulk API key: check env var first, then DB credentials.
 *
 * Priority:
 * 1. process.env.G2BULK_API_KEY (set in .env.local)
 * 2. provider_credentials table (set via /api/g2bulk/settings POST)
 *
 * Returns null if no key is configured anywhere.
 */
export async function resolveG2BulkApiKey(): Promise<string | null> {
  // Priority 1: Env var (highest — overrides DB for local dev)
  const envKey = process.env.G2BULK_API_KEY;
  if (envKey) return envKey;

  // Priority 2: DB provider_credentials (set via dashboard API key editor)
  try {
    const supabase = createSupabaseAdminClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", "g2bulk")
      .single();

    if (!provider) return null;

    const { data: cred } = await supabase
      .from("provider_credentials")
      .select("value")
      .eq("provider_id", provider.id)
      .eq("key", "api_key")
      .eq("is_active", true)
      .maybeSingle();

    return cred?.value || null;
  } catch (err) {
    console.error("Failed to resolve G2Bulk API key from DB:", err);
    return null;
  }
}
