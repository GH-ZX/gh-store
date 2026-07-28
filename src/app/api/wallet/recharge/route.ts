import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  resolveSAMApiKey,
  resolveSAMReceivingWallet,
  resolveSAMWebhookUrl,
  createSAMInvoice,
} from "@/lib/services/sam.service";
import { requireApiAuth } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { walletRechargeSchema } from "@/lib/validation/provider.schema";

/**
 * POST /api/wallet/recharge
 *
 * Starts a wallet top-up: creates a SAM invoice and a pending order tagged
 * `metadata.kind = 'wallet_topup'`, then returns the payment URL.
 *
 * The balance is NOT credited here. It is credited only when SAM confirms
 * payment via the `invoice.paid` webhook, which checks that tag — a purchase
 * invoice must never credit the wallet, or every SAM order would be free.
 */
export async function POST(request: NextRequest) {
  const guard = await requireApiAuth();
  if (guard.error) return guard.error;
  const user = guard.user;

  try {
    const parsed = walletRechargeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    // Round to cents — the amount reaches SAM and the ledger as-is.
    const amount = Math.round(parsed.data.amount * 100) / 100;

    const adminClient = createSupabaseAdminClient();

    const apiKey = await resolveSAMApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Payments are not configured yet" },
        { status: 503 },
      );
    }

    const wallet = await resolveSAMReceivingWallet(adminClient);
    if (!wallet) {
      return NextResponse.json(
        { success: false, message: "Payments are not configured yet" },
        { status: 503 },
      );
    }

    // ─── Create the pending top-up order ────────────
    const { data: orderNumResult } = await adminClient.rpc("generate_order_number");
    const orderNumber = (orderNumResult as string) || `GH-${Date.now()}`;

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        profile_id: user.id,
        status: "awaiting_payment",
        subtotal: amount,
        discount: 0,
        total: amount,
        payment_method: "sam",
        payment_status: "pending",
        metadata: { kind: "wallet_topup" },
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Failed to create top-up order:", orderError);
      return NextResponse.json(
        { success: false, message: "Failed to start recharge" },
        { status: 500 },
      );
    }

    // ─── Create the SAM invoice ─────────────────────
    let invoice;
    try {
      invoice = await createSAMInvoice({
        apiKey,
        wallet,
        amount,
        webhookUrl: await resolveSAMWebhookUrl(adminClient),
      });
    } catch (err) {
      console.error("Top-up invoice failed:", err);
      await adminClient.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { success: false, message: "Payment provider rejected the request" },
        { status: 502 },
      );
    }

    // The webhook matches the callback back to this order by invoice id.
    await adminClient
      .from("orders")
      .update({
        metadata: {
          kind: "wallet_topup",
          sam_invoice_id: invoice.invoiceId,
          sam_payment_url: invoice.paymentUrl,
          sam_method: wallet.method,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      amount,
      paymentUrl: invoice.paymentUrl,
      invoiceId: invoice.invoiceId,
    });
  } catch (err) {
    console.error("Wallet recharge error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to start recharge" },
      { status: 500 },
    );
  }
}
