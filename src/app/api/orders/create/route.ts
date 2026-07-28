import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { priceOrder } from "@/lib/services/pricing.service";
import {
  resolveSAMApiKey,
  resolveSAMReceivingWallet,
  resolveSAMWebhookUrl,
  createSAMInvoice,
  type SamReceivingWallet,
} from "@/lib/services/sam.service";
import { requireApiAuth } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { createOrderSchema } from "@/lib/validation/provider.schema";

/**
 * POST /api/orders/create
 *
 * Creates an order in the database and handles payment:
 * - wallet: deducts wallet balance and marks order as paid
 * - sam: creates SAM invoice and returns payment URL for redirect
 *
 * Pricing is resolved server-side from the `products` table — the request body
 * carries no price fields.
 */
export async function POST(request: NextRequest) {
  const guard = await requireApiAuth();
  if (guard.error) return guard.error;
  const user = guard.user;

  try {
    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    const body = parsed.data;

    // ─── Authoritative pricing ──────────────────────
    const pricing = await priceOrder(body.items);
    if ("error" in pricing) {
      return NextResponse.json({ success: false, message: pricing.error }, { status: 400 });
    }

    const adminClient = createSupabaseAdminClient();

    // For SAM, resolve the merchant receiving wallet before creating anything.
    let samConfig: SamReceivingWallet | null = null;

    if (body.paymentMethod === "sam") {
      samConfig = await resolveSAMReceivingWallet(adminClient);

      if (!samConfig) {
        return NextResponse.json(
          { success: false, message: "Payments are not configured yet" },
          { status: 503 },
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
        subtotal: pricing.subtotal,
        discount: 0,
        total: pricing.total,
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
    const orderItems = pricing.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      dynamic_fields: {
        ...item.fields,
        product_name: item.name,
        ...(item.variantId ? { variant_id: item.variantId } : {}),
        ...(item.variantLabel ? { variant_label: item.variantLabel } : {}),
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
        p_amount: pricing.total,
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
      const samApiKey = await resolveSAMApiKey();

      if (!samApiKey) {
        await adminClient.from("order_items").delete().eq("order_id", order.id);
        await adminClient.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          { success: false, message: "Payments are not configured yet" },
          { status: 503 },
        );
      }

      let invoiceId: string;
      let paymentUrl: string;

      try {
        const invoice = await createSAMInvoice({
          apiKey: samApiKey,
          wallet: samConfig!,
          amount: pricing.total,
          webhookUrl: await resolveSAMWebhookUrl(adminClient),
        });
        invoiceId = invoice.invoiceId;
        paymentUrl = invoice.paymentUrl;
      } catch (err) {
        // Compensate: the order is unpaid and unusable without an invoice.
        console.error("SAM invoice creation failed:", err);
        await adminClient.from("order_items").delete().eq("order_id", order.id);
        await adminClient.from("orders").delete().eq("id", order.id);

        return NextResponse.json(
          { success: false, message: "Payment provider rejected the request" },
          { status: 502 },
        );
      }

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
      { success: false, message: "Failed to create order" },
      { status: 500 },
    );
  }
}
