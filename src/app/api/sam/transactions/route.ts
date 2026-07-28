import { NextResponse } from "next/server";
import { resolveSAMApiKey, SAM_API_BASE } from "@/lib/services/sam.service";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";

export async function GET(request: Request) {
  try {
    const apiKey = await resolveSAMApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SAM API key not configured" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const walletAddress = searchParams.get("walletAddress");
    const phone = searchParams.get("phone");
    const cashCode = searchParams.get("cashCode");
    const direction = searchParams.get("direction") || "all";
    const walletId = searchParams.get("walletId");

    if (!provider) {
      return NextResponse.json(
        { success: false, message: "Missing provider query param" },
        { status: 400 },
      );
    }

    let url: string;
    if (provider === "shamcash" && walletAddress) {
      const query = direction === "all" ? "" : `?direction=${direction}`;
      url = `${SAM_API_BASE}/v1/wallets/shamcash/${walletAddress}/transactions${query}`;
    } else if (provider === "syriatel" && (phone || cashCode)) {
      const identifier = cashCode || phone;
      const query = direction === "all" ? "" : `?direction=${direction}`;
      url = `${SAM_API_BASE}/v1/wallets/syriatel/${identifier}/transactions${query}`;
    } else {
      return NextResponse.json(
        { success: false, message: `Missing identifier for provider ${provider}` },
        { status: 400 },
      );
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, message: `SAM API error (${res.status}): ${errorText}` },
        { status: res.status },
      );
    }

    const transactions = await res.json();

    // Save transactions to Supabase for persistence
    if (walletId && Array.isArray(transactions)) {
      try {
        const supabase = createSupabaseAdminClient();
        for (const tx of transactions) {
          const txRecord = {
            id: String(tx.id),
            wallet_id: walletId,
            type: String(tx.type || ""),
            amount: Number(tx.amount) || 0,
            currency: String(tx.currency || "USD"),
            counterparty: String(tx.counterparty || ""),
            description: tx.description ? String(tx.description) : null,
            status: tx.status ? String(tx.status) : null,
            occurred_at: tx.occurredAt ? new Date(tx.occurredAt).toISOString() : new Date().toISOString(),
            raw_data: JSON.stringify(tx),
            last_synced_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from("sam_transactions")
            .upsert(txRecord, { onConflict: "id" });

          if (upsertError) {
            console.error("Failed to upsert SAM transaction:", upsertError.message);
          }
        }
      } catch (dbErr) {
        // Don't fail the request
        console.error("Failed to save SAM transactions to DB:", dbErr);
      }
    }

    return NextResponse.json({ success: true, transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
