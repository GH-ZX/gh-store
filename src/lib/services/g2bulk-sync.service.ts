import { type createSupabaseAdminClient } from "@/lib/utils/supabase";

/**
 * Shared G2Bulk catalogue persistence.
 *
 * Both the manual sync route (`/api/g2bulk/sync`, which syncs an
 * admin-selected subset) and `G2BulkProvider.syncCatalog()` (which syncs
 * everything, for scheduled runs) write products through here, so the two
 * paths cannot drift apart.
 */

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export interface UpsertOutcome {
  created: boolean;
}

/** Insert a category if its slug is new, otherwise return the existing row. */
export async function getOrCreateCategory(
  supabase: AdminClient,
  slug: string,
  nameAr: string,
  nameEn: string,
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { id: existing.id as string, created: false };

  const { data: inserted, error } = await supabase
    .from("categories")
    .insert({ slug, name_ar: nameAr, name_en: nameEn, is_active: true })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create category "${slug}": ${error?.message ?? "unknown"}`);
  }

  return { id: inserted.id as string, created: true };
}

/**
 * Insert or update a product by slug.
 *
 * Errors are thrown rather than swallowed so callers can record them against
 * the specific item instead of silently reporting a success count.
 */
export async function upsertProduct(
  supabase: AdminClient,
  slug: string,
  data: Record<string, unknown>,
): Promise<UpsertOutcome> {
  const { data: existing, error: selectError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (selectError) throw new Error(`Lookup failed for "${slug}": ${selectError.message}`);

  if (existing) {
    const { error } = await supabase
      .from("products")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) throw new Error(`Update failed for "${slug}": ${error.message}`);
    return { created: false };
  }

  const { error } = await supabase.from("products").insert(data);
  if (error) throw new Error(`Insert failed for "${slug}": ${error.message}`);
  return { created: true };
}

/**
 * Deactivate provider products that were not seen in this sync run.
 *
 * Products are never deleted — orders reference them, and `products.id` is a
 * RESTRICT foreign key from `order_items`.
 */
export async function deactivateMissingProducts(
  supabase: AdminClient,
  providerId: string,
  seenSlugs: string[],
): Promise<number> {
  const { data: stale, error } = await supabase
    .from("products")
    .select("id, slug")
    .eq("provider_id", providerId)
    .eq("status", "active");

  if (error) throw new Error(`Failed to list provider products: ${error.message}`);

  const seen = new Set(seenSlugs);
  const toDeactivate = (stale ?? []).filter((p) => !seen.has(p.slug as string));

  if (toDeactivate.length === 0) return 0;

  const { error: updateError } = await supabase
    .from("products")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .in(
      "id",
      toDeactivate.map((p) => p.id),
    );

  if (updateError) throw new Error(`Failed to deactivate products: ${updateError.message}`);

  return toDeactivate.length;
}

/** Record a sync run for the admin sync-log view. */
export async function recordSyncLog(
  supabase: AdminClient,
  entry: {
    providerId: string;
    /** sync_logs.type — constrained to manual | scheduled | webhook */
    type: "manual" | "scheduled" | "webhook";
    status: "running" | "completed" | "failed" | "partial";
    productsCreated: number;
    productsUpdated: number;
    productsDeactivated: number;
    errors: string[];
    startedAt: string;
  },
): Promise<void> {
  const completedAt = new Date();
  const { error } = await supabase.from("sync_logs").insert({
    provider_id: entry.providerId,
    type: entry.type,
    status: entry.status,
    products_created: entry.productsCreated,
    products_updated: entry.productsUpdated,
    products_deactivated: entry.productsDeactivated,
    // errors is JSONB defaulting to '[]' — pass the array, not a JSON string.
    errors: entry.errors,
    started_at: entry.startedAt,
    completed_at: completedAt.toISOString(),
    duration_ms: completedAt.getTime() - new Date(entry.startedAt).getTime(),
  });

  // A failed log write must not fail the sync itself.
  if (error) console.error("Failed to record sync log:", error.message);
}
