import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { ensureSAMProvider } from "@/lib/services/sam.service";

const CREDENTIAL_KEY = "api_key";
const WEBHOOK_SECRET_KEY = "webhook_secret";
const CONFIG_KEY = "payment_config";

// ─── Types ───────────────────────────────────────────

export interface SAMAdvancedConfig {
  profitMargin: number;        // 0–100 (percentage)
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
  await supabase
    .from("provider_config")
    .upsert(
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
  // Deactivate old secrets
  await supabase
    .from("provider_credentials")
    .update({ is_active: false })
    .eq("provider_id", providerId)
    .eq("key", WEBHOOK_SECRET_KEY);

  // Insert new secret
  const newSecret = generateSecret();
  await supabase.from("provider_credentials").insert({
    provider_id: providerId,
    key: WEBHOOK_SECRET_KEY,
    value: newSecret,
    is_active: true,
  });

  return newSecret;
}

// ─── Route handlers ──────────────────────────────────

/**
 * GET /api/sam/settings
 *
 * Returns API key status + advanced config + webhook URL.
 */
export async function GET() {
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
      maskedKey = (cred.value as string).slice(0, 6) + "..." + (cred.value as string).slice(-4);
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
      { success: false, message: err instanceof Error ? err.message : "Failed to read settings" },
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
  try {
    const body = await request.json();
    const supabase = createSupabaseAdminClient();
    const providerId = await getProviderId();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // ─── Save API key ───────────────────────────────
    if (body.apiKey) {
      const { apiKey } = body as { apiKey?: string };
      if (typeof apiKey !== "string" || !apiKey.trim()) {
        return NextResponse.json({ success: false, message: "API key is required" }, { status: 400 });
      }

      const trimmedKey = apiKey.trim();

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

      const masked = trimmedKey.slice(0, 6) + "..." + trimmedKey.slice(-4);

      return NextResponse.json({
        success: true,
        message: "API key saved successfully",
        keySet: true,
        maskedKey: masked,
        source: "db",
      });
    }

    // ─── Regenerate webhook secret ──────────────────
    if (body.regenerateWebhook) {
      const newSecret = await regenerateWebhookSecret(supabase, providerId);
      const webhookUrl = buildWebhookUrl(supabaseUrl, newSecret);

      return NextResponse.json({
        success: true,
        message: "Webhook secret regenerated successfully",
        webhookUrl,
        regenerated: true,
      });
    }

    // ─── Save advanced config ───────────────────────
    if (body.config) {
      const config = body.config as Partial<SAMAdvancedConfig>;
      const existing = await getConfig(supabase, providerId);

      const merged: SAMAdvancedConfig = {
        ...existing,
        ...config,
      };

      // Validate
      if (typeof merged.profitMargin !== "number" || merged.profitMargin < 0 || merged.profitMargin > 100) {
        return NextResponse.json(
          { success: false, message: "Profit margin must be between 0 and 100" },
          { status: 400 },
        );
      }
      if (!["USD", "SYP", "EUR"].includes(merged.defaultCurrency)) {
        return NextResponse.json(
          { success: false, message: "Currency must be USD, SYP, or EUR" },
          { status: 400 },
        );
      }

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
      { success: false, message: "No data provided (apiKey, config, or regenerateWebhook expected)" },
      { status: 400 },
    );
  } catch (err) {
    console.error("SAM settings POST error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to save settings" },
      { status: 500 },
    );
  }
}
