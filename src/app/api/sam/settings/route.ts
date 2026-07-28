import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSAMProvider } from "@/lib/services/sam.service";
import { requireApiAdmin } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { samSettingsSchema } from "@/lib/validation/provider.schema";

const CREDENTIAL_KEY = "api_key";
const WEBHOOK_SECRET_KEY = "webhook_secret";
const CONFIG_KEY = "payment_config";

// ─── Types ───────────────────────────────────────────

export interface SAMAdvancedConfig {
  profitMargin: number; // 0–100 (percentage)
  defaultWalletId: string | null;
  defaultCurrency: "USD" | "SYP" | "EUR";
  webhookUrl: string;
  autoConfirm: boolean;
}

const DEFAULT_CONFIG: SAMAdvancedConfig = {
  profitMargin: 0,
  defaultWalletId: null,
  defaultCurrency: "USD",
  webhookUrl: "",
  autoConfirm: false,
};

// ─── Helpers ─────────────────────────────────────────

function buildWebhookUrl(supabaseUrl: string, token: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/functions/v1/sam-api?token=${encodeURIComponent(token)}`;
}

/**
 * Generate a cryptographically random hex string for webhook secret.
 * Uses Node.js crypto module (available in Next.js API routes).
 */
function generateSecret(): string {
  return randomBytes(32).toString("hex");
}

async function getProviderId(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  return await ensureSAMProvider(supabase);
}

async function getConfig(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  providerId: string,
): Promise<SAMAdvancedConfig> {
  const { data } = await supabase
    .from("provider_config")
    .select("value")
    .eq("provider_id", providerId)
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  if (data?.value) {
    return { ...DEFAULT_CONFIG, ...(data.value as Partial<SAMAdvancedConfig>) };
  }
  return DEFAULT_CONFIG;
}

async function saveConfig(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  providerId: string,
  config: SAMAdvancedConfig,
): Promise<void> {
  await supabase.from("provider_config").upsert(
    {
      provider_id: providerId,
      key: CONFIG_KEY,
      value: JSON.parse(JSON.stringify(config)),
    },
    { onConflict: "provider_id, key" },
  );
}

/**
 * Get or create the webhook secret from the provider_credentials table.
 */
async function getWebhookSecret(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  providerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("provider_credentials")
    .select("value")
    .eq("provider_id", providerId)
    .eq("key", WEBHOOK_SECRET_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (data?.value) {
    return data.value as string;
  }
  return null;
}

/**
 * Generate and store a new webhook secret, returning the new secret.
 */
async function regenerateWebhookSecret(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  providerId: string,
): Promise<string> {
  // Delete rather than deactivate: provider_credentials has
  // UNIQUE(provider_id, key), so leaving a deactivated row in place made every
  // rotation after the first fail on the unique constraint. Deleting matches
  // what the edge function and the save_sam_api_settings RPC already do.
  const { error: deleteError } = await supabase
    .from("provider_credentials")
    .delete()
    .eq("provider_id", providerId)
    .eq("key", WEBHOOK_SECRET_KEY);

  if (deleteError) throw new Error(`Failed to clear old webhook secret: ${deleteError.message}`);

  const newSecret = generateSecret();
  const { error: insertError } = await supabase.from("provider_credentials").insert({
    provider_id: providerId,
    key: WEBHOOK_SECRET_KEY,
    value: newSecret,
    is_active: true,
  });

  if (insertError) throw new Error(`Failed to store webhook secret: ${insertError.message}`);

  return newSecret;
}

// ─── Route handlers ──────────────────────────────────

/**
 * GET /api/sam/settings
 *
 * Returns API key status + advanced config + webhook URL.
 */
export async function GET() {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const supabase = createSupabaseAdminClient();
    const providerId = await getProviderId();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // Check DB first for API key
    const { data: cred } = await supabase
      .from("provider_credentials")
      .select("value")
      .eq("provider_id", providerId)
      .eq("key", CREDENTIAL_KEY)
      .eq("is_active", true)
      .maybeSingle();

    let keySet = false;
    let maskedKey = "";
    const source = "db";

    if (cred?.value) {
      keySet = true;
      maskedKey = "••••" + (cred.value as string).slice(-4);
    }

    // Fetch advanced config
    const config = await getConfig(supabase, providerId);

    // Fetch webhook secret & build URL
    const webhookSecret = await getWebhookSecret(supabase, providerId);
    let webhookUrl = "";
    if (webhookSecret && supabaseUrl) {
      webhookUrl = buildWebhookUrl(supabaseUrl, webhookSecret);
    }

    // Fetch wallets for default wallet dropdown
    const { data: wallets } = await supabase
      .from("sam_wallets")
      .select("id, provider_display_name, label, provider")
      .order("provider_display_name");

    return NextResponse.json({
      success: true,
      keySet,
      maskedKey,
      source,
      config: { ...config, webhookUrl },
      wallets: wallets || [],
    });
  } catch (err) {
    console.error("SAM settings GET error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to read settings" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sam/settings
 *
 * Saves API key OR advanced config OR regenerates webhook secret.
 * - If { apiKey } → saves credential
 * - If { config } → saves advanced config
 * - If { regenerateWebhook: true } → generates new webhook secret
 */
export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const parsed = samSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const supabase = createSupabaseAdminClient();
    const providerId = await getProviderId();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // ─── Save API key ───────────────────────────────
    if (body.apiKey) {
      const trimmedKey = body.apiKey;

      await supabase
        .from("provider_credentials")
        .delete()
        .eq("provider_id", providerId)
        .eq("key", CREDENTIAL_KEY);

      const { error: insertError } = await supabase.from("provider_credentials").insert({
        provider_id: providerId,
        key: CREDENTIAL_KEY,
        value: trimmedKey,
        is_active: true,
      });

      if (insertError) throw new Error(`Failed to store API key: ${insertError.message}`);

      return NextResponse.json({
        success: true,
        message: "API key saved successfully",
        keySet: true,
        maskedKey: "••••" + trimmedKey.slice(-4),
        source: "db",
      });
    }

    // ─── Regenerate webhook secret ──────────────────
    if (body.regenerateWebhook) {
      const newSecret = await regenerateWebhookSecret(supabase, providerId);
      const webhookUrl = buildWebhookUrl(supabaseUrl, newSecret);

      // Returned once, at the moment of rotation, to an authenticated admin —
      // this is the only path that exposes the full webhook URL.
      return NextResponse.json({
        success: true,
        message: "Webhook secret regenerated successfully",
        webhookUrl,
        regenerated: true,
      });
    }

    // ─── Save advanced config ───────────────────────
    if (body.config) {
      const existing = await getConfig(supabase, providerId);
      const merged: SAMAdvancedConfig = { ...existing, ...body.config };

      // Refresh webhook URL from DB
      const webhookSecret = await getWebhookSecret(supabase, providerId);
      if (webhookSecret && supabaseUrl) {
        merged.webhookUrl = buildWebhookUrl(supabaseUrl, webhookSecret);
      }

      await saveConfig(supabase, providerId, merged);

      return NextResponse.json({
        success: true,
        message: "Settings saved successfully",
        config: merged,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "No data provided (apiKey, config, or regenerateWebhook expected)",
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("SAM settings POST error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save settings" },
      { status: 500 },
    );
  }
}
