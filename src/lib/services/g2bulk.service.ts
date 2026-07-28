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
 * Resolve the G2Bulk API key from the provider_credentials table.
 * The key is stored in Supabase by the admin via the dashboard settings.
 *
 * Returns null if no key is configured.
 */
export async function resolveG2BulkApiKey(): Promise<string | null> {
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
