import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureG2BulkProvider } from "@/lib/services/g2bulk.service";
import { requireApiAdmin } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { apiKeySchema } from "@/lib/validation/provider.schema";

const CREDENTIAL_KEY = "api_key";

/**
 * GET /api/g2bulk/settings
 *
 * Returns whether an API key is configured and a masked version of it.
 * Never exposes the full key. Only reads from the provider_credentials table.
 *
 * Admin-only: uses the service-role client, which bypasses RLS.
 */
export async function GET() {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const supabase = createSupabaseAdminClient();
    const providerId = await ensureG2BulkProvider(supabase);

    const { data: cred } = await supabase
      .from("provider_credentials")
      .select("value")
      .eq("provider_id", providerId)
      .eq("key", CREDENTIAL_KEY)
      .eq("is_active", true)
      .maybeSingle();

    if (cred?.value) {
      // Only the last 4 characters — enough to confirm which key is configured
      // without handing out usable key material.
      const masked = "••••" + (cred.value as string).slice(-4);
      return NextResponse.json({
        success: true,
        keySet: true,
        maskedKey: masked,
        source: "db",
      });
    }

    return NextResponse.json({
      success: true,
      keySet: false,
      maskedKey: "",
      source: "none",
    });
  } catch (err) {
    console.error("G2Bulk settings GET error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to read settings" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/g2bulk/settings
 *
 * Saves the G2Bulk API key to the provider_credentials table.
 * Body: { apiKey: string }
 */
export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const parsed = apiKeySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const trimmedKey = parsed.data.apiKey;

    const supabase = createSupabaseAdminClient();
    const providerId = await ensureG2BulkProvider(supabase);

    // Upsert the credential: delete old first, then insert new
    // Using delete + insert instead of upsert to handle the UNIQUE constraint cleanly
    await supabase
      .from("provider_credentials")
      .delete()
      .eq("provider_id", providerId)
      .eq("key", CREDENTIAL_KEY);

    await supabase.from("provider_credentials").insert({
      provider_id: providerId,
      key: CREDENTIAL_KEY,
      value: trimmedKey,
      is_active: true,
    });

    // Invalidate any cached provider state in the registry
    // (The G2BulkProvider will lazy-resolve from DB on next request)

    return NextResponse.json({
      success: true,
      message: "API key saved successfully",
      keySet: true,
      maskedKey: "••••" + trimmedKey.slice(-4),
      source: "db",
    });
  } catch (err) {
    console.error("G2Bulk settings POST error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save settings" },
      { status: 500 },
    );
  }
}
