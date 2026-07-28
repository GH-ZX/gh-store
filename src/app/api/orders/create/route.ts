import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { createSupabaseServerClient } from "@/lib/utils/supabase";

interface CreateOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fields?: Record<string, string>;
}

interface CreateOrderRequest {
  paymentMethod: "wallet" | "sam";
  items: CreateOrderItem[];
  subtotal: number;
  total: number;
  notes?: string;
}

/**
 * POST /api/orders/create
 *
 * Creates an order in the database and handles payment:
 * - wallet: deducts wallet balance and marks order as paid
 * - sam: creates SAM invoice and returns payment URL for redirect
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabaseServer = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const body: CreateOrderRequest = await request.json();

    // ─── Validate ───────────────────────────────────
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 },
      );
    }

    if (!["wallet", "sam"].includes(body.paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 },
      );
    }

    const adminClient = createSupabaseAdminClient();

    // For SAM, pre-fetch the default wallet config from DB
    let samConfig: {
      method: "shamcash" | "syriatel";
      identifier: string;
    } | null = null;

    if (body.paymentMethod === "sam") {
      const { data: provider } = await adminClient
        .from("providers")
        .select("id")
        .eq("slug", "sam-api")
        .maybeSingle();

      if (provider) {
        // Get the advanced config for default wallet
        const { data: providerConfig } = await adminClient
          .from("provider_config")
          .select("value")
          .eq("provider_id", provider.id)
          .eq("key", "payment_config")
          .maybeSingle();

        if (providerConfig?.value) {
          const config = providerConfig.value as Record<string, unknown>;
          const defaultWalletId = String(config.defaultWalletId || "");

          if (defaultWalletId) {
            // Fetch the wallet details to get the identifier
            const { data: wallet } = await adminClient
              .from("sam_wallets")
              .select("provider, wallet_address, phone, cash_code")
              .eq("id", defaultWalletId)
              .maybeSingle();

            if (wallet) {
              samConfig = {
                method: (wallet.provider === "syriatel" ? "syriatel" : "shamcash") as "shamcash" | "syriatel",
                identifier: String(wallet.wallet_address || wallet.phone || wallet.cash_code || ""),
              };
            }
          }
        }
      }

      if (!samConfig?.identifier) {
        return NextResponse.json(
          { success: false, message: "SAM API receiving wallet not configured. Please configure a default wallet in the SAM API settings." },
          { status: 400 },
        );
      }
    }

    // ─── Generate Order Number ──────────────────────
    const { data: orderNumResult } = await adminClient.rpc("generate_order_number");
    const orderNumber = orderNumResult as string || `GH-${Date.now()}`;

    // ─── Create Order ───────────────────────────────
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        profile_id: user.id,
        status: "pending",
        subtotal: body.subtotal || body.total,
        discount: 0,
        total: body.total,
        payment_method: body.paymentMethod,
        payment_status: "pending",
        notes: body.notes || null,
        metadata: {},
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { success: false, message: "Failed to create order" },
        { status: 500 },
      );
    }

    // ─── Create Order Items ─────────────────────────
    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      dynamic_fields: {
        ...(item.fields || {}),
        product_name: item.name,
      },
    }));

    const { error: itemsError } = await adminClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
      // Clean up the order
      await adminClient.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { success: false, message: "Failed to create order items" },
        { status: 500 },
      );
    }

    // ─── Record initial status history ──────────────
    await adminClient
      .from("order_status_history")
      .insert({
        order_id: order.id,
        old_status: null,
        new_status: "pending",
        reason: "Order created",
      });

    // ─── Handle Payment ─────────────────────────────

    // ─── WALLET PAYMENT ─────────────────────────
    if (body.paymentMethod === "wallet") {
      const { data: deductResult } = await adminClient.rpc("deduct_wallet_balance", {
        p_profile_id: user.id,
        p_amount: body.total,
        p_description: `Payment for order ${orderNumber}`,
        p_reference_type: "order",
        p_reference_id: order.id,
      });

      const result = deductResult as Record<string, unknown>;

      if (!result?.success) {
        // Clean up — delete order since payment failed
        const errorMsg = String(result?.error || "Payment failed");
        await adminClient.from("orders").delete().eq("id", order.id);
        await adminClient.from("order_items").delete().eq("order_id", order.id);

        return NextResponse.json(
          { success: false, message: errorMsg === "insufficient_balance" ? "Insufficient wallet balance" : "Payment failed" },
          { status: 400 },
        );
      }

      // Update order status to paid
      await adminClient
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      await adminClient
        .from("order_status_history")
        .insert({
          order_id: order.id,
          old_status: "pending",
          new_status: "processing",
          reason: "Payment received via wallet",
        });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentMethod: "wallet",
      });
    }

    // ─── SAM PAYMENT ────────────────────────────
    if (body.paymentMethod === "sam") {
      // We need the SAM API key and webhook URL to create the invoice
      // First find the SAM provider
      const { data: provider } = await adminClient
        .from("providers")
        .select("id")
        .eq("slug", "sam-api")
        .maybeSingle();

      if (!provider) {
        await adminClient.from("orders").delete().eq("id", order.id);
        await adminClient.from("order_items").delete().eq("order_id", order.id);
        return NextResponse.json(
          { success: false, message: "SAM API provider not configured" },
          { status: 400 },
        );
      }

      // Get the webhook secret
      const { data: webhookSecret } = await adminClient
        .from("provider_credentials")
        .select("value")
        .eq("provider_id", provider.id)
        .eq("key", "webhook_secret")
        .eq("is_active", true)
        .maybeSingle();

      const { data: apiKeyCred } = await adminClient
        .from("provider_credentials")
        .select("value")
        .eq("provider_id", provider.id)
        .eq("key", "api_key")
        .eq("is_active", true)
        .maybeSingle();

      if (!apiKeyCred?.value) {
        await adminClient.from("orders").delete().eq("id", order.id);
        await adminClient.from("order_items").delete().eq("order_id", order.id);
        return NextResponse.json(
          { success: false, message: "SAM API key not configured" },
          { status: 400 },
        );
      }

      // Build the webhook URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      let webhookUrl = "";
      if (webhookSecret?.value && supabaseUrl) {
        const base = supabaseUrl.replace(/\/$/, "");
        webhookUrl = `${base}/functions/v1/sam-api?token=${encodeURIComponent(String(webhookSecret.value))}`;
      }

      // Use pre-fetched SAM config
      const samApiKey = String(apiKeyCred.value);
      const SAM_API_BASE = "https://sam-api.pro/api";

      const invoicePayload: Record<string, string> = {
        method: samConfig!.method,
        identifier: samConfig!.identifier,
        amount: String(body.total),
        currency: "USD",
      };

      if (webhookUrl) {
        invoicePayload.webhookUrl = webhookUrl;
      }

      const samRes = await fetch(`${SAM_API_BASE}/v1/invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${samApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(invoicePayload),
      });

      const samData = await samRes.json();

      if (!samRes.ok) {
        // Clean up order since invoice creation failed
        await adminClient.from("orders").delete().eq("id", order.id);
        await adminClient.from("order_items").delete().eq("order_id", order.id);

        return NextResponse.json(
          {
            success: false,
            message: `SAM payment failed: ${samData.message || samData.error || "Unknown error"}`,
          },
          { status: 400 },
        );
      }

      const invoiceId = String(samData.invoiceId || "");
      const paymentUrl = String(samData.paymentUrl || "");

      // Store invoice ID in order metadata
      if (invoiceId) {
        await adminClient
          .from("orders")
          .update({
            metadata: {
              sam_invoice_id: invoiceId,
              sam_payment_url: paymentUrl,
              sam_method: samConfig!.method,
              sam_identifier: samConfig!.identifier,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        paymentMethod: "sam",
        paymentUrl,
        invoiceId,
      });
    }

    // Should never reach here
    return NextResponse.json(
      { success: false, message: "Invalid payment method" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to create order" },
      { status: 500 },
    );
  }
}
