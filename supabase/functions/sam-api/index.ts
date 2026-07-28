import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SAM_API_BASE = "https://sam-api.pro/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Json = Record<string, unknown>;

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// ─── Helpers ──────────────────────────────────────────

function buildWebhookUrl(supabaseUrl: string, token: string) {
  const base = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/sam-api`;
  return `${base}?token=${encodeURIComponent(token)}`;
}

/**
 * Resolve the SAM provider ID from the providers table.
 * Creates one if it doesn't exist.
 */
async function resolveSamProviderId(
  serviceClient: ReturnType<typeof createClient>,
): Promise<string> {
  const { data: existing } = await serviceClient
    .from("providers")
    .select("id")
    .eq("slug", "sam-api")
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await serviceClient
    .from("providers")
    .insert({
      name: "SAM API",
      slug: "sam-api",
      description: "ShamCash & Syriatel Cash payment gateway",
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    throw new Error("Failed to create SAM provider: " + (error?.message || "unknown"));
  }

  return inserted.id as string;
}

async function resolveSamApiKey(
  serviceClient: ReturnType<typeof createClient>,
  providerId: string,
) {
  // Try environment variable first
  const envKey = Deno.env.get("SAM_API_KEY")?.trim();
  if (envKey) return envKey;

  // Fall back to database — filter by provider_id
  const { data } = await serviceClient
    .from("provider_credentials")
    .select("value")
    .eq("provider_id", providerId)
    .eq("key", "api_key")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data?.value as string | null)?.trim() || null;
}

async function resolveWebhookSecret(
  serviceClient: ReturnType<typeof createClient>,
  providerId: string,
) {
  const envSecret = Deno.env.get("SAM_WEBHOOK_SECRET")?.trim();
  if (envSecret) return envSecret;

  const { data } = await serviceClient
    .from("provider_credentials")
    .select("value")
    .eq("provider_id", providerId)
    .eq("key", "webhook_secret")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data?.value as string | null)?.trim() || null;
}

async function samFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${SAM_API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let data: Json = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

function samErrorMessage(data: Json, fallback: string) {
  const code = typeof data.code === "string" ? data.code : "";
  const message = typeof data.message === "string" ? data.message : fallback;
  return code ? `${code}: ${message}` : message;
}

// ─── Main Handler ─────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ success: false, message: "Supabase env not configured" }, 500);
  }

  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token")?.trim() || "";
  const body = await readJson(req);
  const isWebhookEvent = body.event === "invoice.paid" || body.event === "invoice.expired";
  const action = String(body.action || (isWebhookEvent ? "webhook" : ""));

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  // Resolve SAM provider ID early for credential lookups
  const samProviderId = await resolveSamProviderId(serviceClient).catch(() => "");

  // ─── WEBHOOK HANDLER ────────────────────────────
  if (action === "webhook" || isWebhookEvent) {
    const expectedToken = await resolveWebhookSecret(serviceClient, samProviderId);
    if (!expectedToken || queryToken !== expectedToken) {
      return jsonResponse({ success: false, message: "Invalid webhook token" }, 401);
    }

    const event = String(body.event || "");
    const invoiceId = String(body.invoiceId || "").trim();

    if (event === "invoice.paid" && invoiceId) {
      // Find order by SAM invoice ID stored in order.metadata
      const { data: order, error: findError } = await serviceClient
        .from("orders")
        .select("id, profile_id, total, payment_status, metadata")
        .filter("metadata->>sam_invoice_id", "eq", invoiceId)
        .maybeSingle();

      if (findError || !order) {
        console.error("Webhook: order not found for invoice", invoiceId, findError?.message);
        return jsonResponse({ success: false, message: "Order not found" }, 404);
      }

      if (order.payment_status === "paid") {
        // Already processed — idempotent
        return jsonResponse({ success: true, message: "Already paid", invoiceId });
      }

      // Update order: payment_status = paid, status = processing
      const { error: updateErr } = await serviceClient
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateErr) {
        console.error("Webhook: failed to update order", order.id, updateErr.message);
        return jsonResponse({ success: false, message: "Failed to update order" }, 500);
      }

      // Record status history
      await serviceClient.from("order_status_history").insert({
        order_id: order.id,
        old_status: "pending",
        new_status: "processing",
        reason: "Payment confirmed via SAM API webhook",
      });

      // Only a wallet TOP-UP credits the wallet.
      //
      // A normal purchase invoice is the customer *paying for goods* — crediting
      // their wallet by the same amount would hand back the full purchase price
      // and make every SAM order free. Top-ups are created by
      // /api/wallet/recharge and tagged with metadata.kind = 'wallet_topup'.
      const isTopup = (order.metadata as Record<string, unknown> | null)?.kind === "wallet_topup";

      if (isTopup) {
        const { data: credited, error: creditErr } = await serviceClient.rpc(
          "credit_wallet_balance",
          {
            p_profile_id: order.profile_id,
            p_amount: Number(order.total),
            p_description: "Wallet top-up via SAM API",
            p_reference_type: "order",
            p_reference_id: order.id,
          },
        );

        if (creditErr || !(credited as Record<string, unknown>)?.success) {
          console.error(
            "Webhook: failed to credit wallet for order",
            order.id,
            creditErr?.message ?? credited,
          );
          return jsonResponse({ success: false, message: "Failed to credit wallet" }, 500);
        }
      }

      return jsonResponse({
        success: true,
        message: isTopup
          ? "Payment confirmed, wallet credited"
          : "Payment confirmed, order updated",
        event,
        invoiceId,
        orderId: order.id,
      });
    }

    if (event === "invoice.expired" && invoiceId) {
      // Mark order payment as failed
      const { data: order } = await serviceClient
        .from("orders")
        .select("id")
        .filter("metadata->>sam_invoice_id", "eq", invoiceId)
        .maybeSingle();

      if (order) {
        await serviceClient
          .from("orders")
          .update({ payment_status: "failed", updated_at: new Date().toISOString() })
          .eq("id", order.id);
      }

      return jsonResponse({
        success: true,
        message: "Invoice expired, order updated",
        event,
        invoiceId,
      });
    }

    return jsonResponse({ success: false, message: "Unsupported webhook event" }, 400);
  }

  // ─── AUTH CHECK ─────────────────────────────────
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ success: false, message: "Unauthorized" }, 401);
  }
  const userId = authData.user.id;

  // Check admin
  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const userIsAdmin = profile?.role === "admin";

  if (!userIsAdmin) {
    return jsonResponse({ success: false, message: "Admin only" }, 403);
  }

  // ─── GET SETTINGS ───────────────────────────────
  if (action === "getSettings") {
    const apiKey = await resolveSamApiKey(serviceClient, samProviderId);
    const webhookSecret = await resolveWebhookSecret(serviceClient, samProviderId);

    const settings: Json = {
      sam_api_key_set: !!apiKey,
    };

    if (webhookSecret) {
      settings.webhookUrl = buildWebhookUrl(supabaseUrl, webhookSecret);
    }

    return jsonResponse({ success: true, settings });
  }

  // ─── SAVE SETTINGS ──────────────────────────────
  if (action === "saveSettings") {
    const p_api_key = body.apiKey !== undefined ? String(body.apiKey).trim() : null;
    const p_regenerate_webhook = !!body.regenerateWebhook;

    if (!samProviderId) {
      return jsonResponse({ success: false, message: "SAM provider not configured" }, 500);
    }

    if (p_api_key) {
      // Delete old key
      await serviceClient
        .from("provider_credentials")
        .delete()
        .eq("provider_id", samProviderId)
        .eq("key", "api_key");

      // Insert new key with provider_id
      await serviceClient
        .from("provider_credentials")
        .insert({ provider_id: samProviderId, key: "api_key", value: p_api_key, is_active: true });
    }

    if (p_regenerate_webhook) {
      // Generate new secret
      const newSecret =
        crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

      // Delete old secret
      await serviceClient
        .from("provider_credentials")
        .delete()
        .eq("provider_id", samProviderId)
        .eq("key", "webhook_secret");

      // Insert new secret with provider_id
      await serviceClient
        .from("provider_credentials")
        .insert({
          provider_id: samProviderId,
          key: "webhook_secret",
          value: newSecret,
          is_active: true,
        });
    }

    const apiKey = await resolveSamApiKey(serviceClient, samProviderId);
    const webhookSecret = await resolveWebhookSecret(serviceClient, samProviderId);

    const result: Json = {
      success: true,
      key_set: !!apiKey,
    };

    if (webhookSecret) {
      result.webhookUrl = buildWebhookUrl(supabaseUrl, webhookSecret);
    }

    return jsonResponse(result);
  }

  // ─── SAM API ACTIONS ────────────────────────────
  const apiKey = await resolveSamApiKey(serviceClient, samProviderId);
  if (!apiKey) {
    return jsonResponse({ success: false, message: "Sam API key not configured" }, 400);
  }

  if (action === "listWallets") {
    const { res, data } = await samFetch(apiKey, "/v1/wallets");
    if (!res.ok) {
      return jsonResponse(
        { success: false, message: samErrorMessage(data, "Failed to list wallets") },
        res.status,
      );
    }
    return jsonResponse({ success: true, wallets: data });
  }

  if (action === "getBalance") {
    const provider = String(body.provider || "");
    const identifier = String(body.identifier || "").trim();
    if (!provider || !identifier) {
      return jsonResponse({ success: false, message: "provider and identifier required" }, 400);
    }
    if (provider !== "shamcash" && provider !== "syriatel") {
      return jsonResponse({ success: false, message: "Invalid provider" }, 400);
    }

    const { res, data } = await samFetch(
      apiKey,
      `/v1/wallets/${provider}/${encodeURIComponent(identifier)}/balance`,
    );
    if (!res.ok) {
      return jsonResponse(
        { success: false, message: samErrorMessage(data, "Failed to read balance") },
        res.status,
      );
    }
    return jsonResponse({ success: true, balances: data });
  }

  if (action === "getAllWalletBalances") {
    const { res, data } = await samFetch(apiKey, "/v1/wallets");
    if (!res.ok) {
      return jsonResponse(
        { success: false, message: samErrorMessage(data, "Failed to list wallets") },
        res.status,
      );
    }

    const walletList = Array.isArray(data) ? data : [];
    const results: Json[] = [];

    for (const wallet of walletList) {
      const row = wallet as Record<string, unknown>;
      const provider = row.provider === "syriatel" ? "syriatel" : "shamcash";
      const identifier = String(
        row.walletAddress || row.phone || row.cashCode || row.accountNumber || row.id || "",
      ).trim();

      if (!identifier) {
        results.push({
          id: row.id,
          provider,
          providerDisplayName: row.providerDisplayName || provider,
          label: row.label,
          identifier: null,
          balances: [],
          error: "Missing wallet identifier",
        });
        continue;
      }

      const { res: balRes, data: balData } = await samFetch(
        apiKey,
        `/v1/wallets/${provider}/${encodeURIComponent(identifier)}/balance`,
      );

      results.push({
        id: row.id,
        provider,
        providerDisplayName: row.providerDisplayName || provider,
        label: row.label,
        identifier,
        balances: balRes.ok && Array.isArray(balData) ? balData : [],
        error: balRes.ok ? null : samErrorMessage(balData as Json, "Failed to read balance"),
      });
    }

    return jsonResponse({ success: true, wallets: results });
  }

  // ─── CREATE INVOICE ───────────────────────────
  if (action === "createInvoice") {
    const {
      method = "",
      identifier = "",
      amount = "0",
      currency = "USD",
      orderId = null,
    } = body as Record<string, unknown>;

    if (!method || !identifier || !amount) {
      return jsonResponse(
        { success: false, message: "method, identifier, and amount are required" },
        400,
      );
    }

    if (method !== "shamcash" && method !== "syriatel") {
      return jsonResponse({ success: false, message: "method must be shamcash or syriatel" }, 400);
    }

    // Get the webhook secret for this invoice
    const webhookSecret = await resolveWebhookSecret(serviceClient, samProviderId);
    const webhookUrl = webhookSecret ? buildWebhookUrl(supabaseUrl, webhookSecret) : "";

    const invoicePayload: Json = {
      method,
      identifier,
      amount: String(amount),
      currency: String(currency || "USD"),
    };

    if (webhookUrl) {
      invoicePayload.webhookUrl = webhookUrl;
    }

    const { res, data } = await samFetch(apiKey, "/v1/invoices", {
      method: "POST",
      body: JSON.stringify(invoicePayload),
    });

    if (!res.ok) {
      return jsonResponse(
        { success: false, message: samErrorMessage(data as Json, "Failed to create invoice") },
        res.status,
      );
    }

    const invoiceData = data as Record<string, unknown>;
    const resultInvoiceId = String(invoiceData.invoiceId || "");
    const paymentUrl = String(invoiceData.paymentUrl || "");

    // If an orderId was provided, store the SAM invoice ID in order metadata
    if (orderId && resultInvoiceId) {
      const { data: existingOrder } = await serviceClient
        .from("orders")
        .select("metadata")
        .eq("id", orderId)
        .maybeSingle();

      if (existingOrder) {
        const metadata = (existingOrder.metadata as Record<string, unknown>) || {};
        metadata.sam_invoice_id = resultInvoiceId;
        metadata.sam_payment_url = paymentUrl;

        await serviceClient
          .from("orders")
          .update({ metadata, updated_at: new Date().toISOString() })
          .eq("id", orderId);
      }
    }

    return jsonResponse({
      success: true,
      invoice: {
        invoiceId: resultInvoiceId,
        paymentUrl,
        expiresAt: invoiceData.expiresAt || null,
      },
    });
  }

  return jsonResponse({ success: false, message: `Unknown action: ${action}` }, 400);
});
