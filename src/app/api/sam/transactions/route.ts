import { NextResponse } from "next/server";
import { resolveSAMApiKey, SAM_API_BASE } from "@/lib/services/sam.service";
import { requireApiAdmin } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { samTransactionsQuerySchema } from "@/lib/validation/provider.schema";

/**
 * GET /api/sam/transactions
 *
 * Fetches transaction history for one merchant wallet from the SAM API and
 * mirrors it into `sam_transactions`.
 *
 * Admin-only: this exposes merchant payment history and writes to an
 * admin-owned table with the service-role client.
 */
export async function GET(request: Request) {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = samTransactionsQuerySchema.safeParse({
      provider: searchParams.get("provider") ?? undefined,
      walletAddress: searchParams.get("walletAddress") ?? undefined,
      phone: searchParams.get("phone") ?? undefined,
      cashCode: searchParams.get("cashCode") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
      walletId: searchParams.get("walletId") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 },
      );
    }

    const { provider, walletAddress, phone, cashCode, direction, walletId } = parsed.data;

    const apiKey = await resolveSAMApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SAM API key not configured" },
        { status: 400 },
      );
    }

    // The identifier goes into a URL *path* segment, so it must be
    // percent-encoded. The schema also restricts it to [A-Za-z0-9_-], so a
    // traversal sequence cannot reach here in the first place.
    const identifier = provider === "shamcash" ? walletAddress! : (cashCode || phone)!;

    const url = new URL(
      `${SAM_API_BASE}/v1/wallets/${provider}/${encodeURIComponent(identifier)}/transactions`,
    );
    if (direction !== "all") url.searchParams.set("direction", direction);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`SAM transactions upstream error (${res.status}):`, errorText);
      return NextResponse.json(
        { success: false, message: `SAM API request failed (${res.status})` },
        { status: res.status },
      );
    }

    const transactions = await res.json();

    // Mirror into Supabase for persistence. `walletId` is a UUID per the schema
    // and is verified to be a wallet we actually know about before being used
    // as a foreign key.
    if (walletId && Array.isArray(transactions)) {
      try {
        const supabase = createSupabaseAdminClient();

        const { data: knownWallet } = await supabase
          .from("sam_wallets")
          .select("id")
          .eq("id", walletId)
          .maybeSingle();

        if (!knownWallet) {
          console.warn("Skipping transaction sync for unknown wallet:", walletId);
        } else {
          const rows = transactions.map((tx: Record<string, unknown>) => ({
            id: String(tx.id),
            wallet_id: walletId,
            type: String(tx.type || ""),
            amount: Number(tx.amount) || 0,
            currency: String(tx.currency || "USD"),
            counterparty: String(tx.counterparty || ""),
            description: tx.description ? String(tx.description) : null,
            status: tx.status ? String(tx.status) : null,
            occurred_at: tx.occurredAt
              ? new Date(tx.occurredAt as string).toISOString()
              : new Date().toISOString(),
            // raw_data is JSONB — pass the object, not a JSON string.
            raw_data: tx,
            last_synced_at: new Date().toISOString(),
          }));

          if (rows.length > 0) {
            const { error: upsertError } = await supabase
              .from("sam_transactions")
              .upsert(rows, { onConflict: "id" });

            if (upsertError) {
              console.error("Failed to upsert SAM transactions:", upsertError.message);
            }
          }
        }
      } catch (dbErr) {
        // Persistence is best-effort — the caller still gets the live data.
        console.error("Failed to save SAM transactions to DB:", dbErr);
      }
    }

    return NextResponse.json({ success: true, transactions });
  } catch (err) {
    console.error("SAM transactions GET error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
