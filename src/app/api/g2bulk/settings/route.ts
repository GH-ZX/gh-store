import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { ensureG2BulkProvider } from "@/lib/services/g2bulk.service";

const CREDENTIAL_KEY = "api_key";

/**
 * GET /api/g2bulk/settings
 *
 * Returns whether an API key is configured and a masked version of it.
 * Never exposes the full key. Only reads from the provider_credentials table.
 */
export async function GET() {
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
      const masked = (cred.value as string).slice(0, 6) + "..." + (cred.value as string).slice(-4);
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
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to read settings",
      },
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
  try {
    const body = await request.json();
    const { apiKey } = body as { apiKey?: string };

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, message: "API key is required" },
        { status: 400 },
      );
    }

    const trimmedKey = apiKey.trim();

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

    const masked = trimmedKey.slice(0, 6) + "..." + trimmedKey.slice(-4);

    return NextResponse.json({
      success: true,
      message: "API key saved successfully",
      keySet: true,
      maskedKey: masked,
      source: "db",
    });
  } catch (err) {
    console.error("G2Bulk settings POST error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to save settings",
      },
      { status: 500 },
    );
  }
}
