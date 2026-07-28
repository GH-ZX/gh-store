import { NextResponse } from "next/server";
import { resolveSAMApiKey, SAM_API_BASE } from "@/lib/services/sam.service";
import { requireApiAdmin } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";

async function fetchBalance(
  apiKey: string,
  wallet: {
    provider: string;
    walletAddress?: string;
    phone?: string;
    cashCode?: string;
  },
): Promise<{ currency: string; amount: number; label: string | null }[] | null> {
  try {
    let url: string;
    if (wallet.provider === "shamcash" && wallet.walletAddress) {
      url = `${SAM_API_BASE}/v1/wallets/shamcash/${wallet.walletAddress}/balance`;
    } else if (wallet.provider === "syriatel" && (wallet.phone || wallet.cashCode)) {
      url = `${SAM_API_BASE}/v1/wallets/syriatel/${wallet.cashCode || wallet.phone}/balance`;
    } else {
      return null;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  try {
    const apiKey = await resolveSAMApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "SAM API key not configured" },
        { status: 400 },
      );
    }

    const res = await fetch(`${SAM_API_BASE}/v1/wallets`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(`SAM wallets upstream error (${res.status}):`, errorText);
      return NextResponse.json(
        { success: false, message: `SAM API request failed (${res.status})` },
        { status: res.status },
      );
    }

    const wallets = await res.json();

    // Fetch balance for each wallet in parallel
    const walletsWithBalance = await Promise.all(
      wallets.map(async (w: Record<string, unknown>) => {
        const balances = await fetchBalance(
          apiKey,
          w as {
            provider: string;
            walletAddress?: string;
            phone?: string;
            cashCode?: string;
          },
        );
        return { ...w, balances };
      }),
    );

    // Save wallets to Supabase for persistence
    try {
      const supabase = createSupabaseAdminClient();
      for (const wallet of walletsWithBalance) {
        const walletRecord = {
          id: String(wallet.id),
          provider: String(wallet.provider || ""),
          provider_display_name: String(wallet.providerDisplayName || ""),
          label: String(wallet.label || ""),
          phone: String(wallet.phone || ""),
          wallet_address: String(wallet.walletAddress || ""),
          account_number: String(wallet.accountNumber || ""),
          cash_code: String(wallet.cashCode || ""),
          region: String(wallet.region || ""),
          status: String(wallet.status || "active"),
          // These columns are JSONB — pass the objects directly. Calling
          // JSON.stringify here stored a JSON *string* scalar instead, so
          // readers expecting an array got a string back.
          balances: wallet.balances ?? [],
          raw_data: wallet,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert: insert if not exists, update if exists
        const { error: upsertError } = await supabase
          .from("sam_wallets")
          .upsert(walletRecord, { onConflict: "id" });

        if (upsertError) {
          console.error("Failed to upsert SAM wallet:", upsertError.message);
        }
      }
    } catch (dbErr) {
      // Don't fail the request — just log the error
      console.error("Failed to save SAM wallets to DB:", dbErr);
    }

    return NextResponse.json({ success: true, wallets: walletsWithBalance });
  } catch (err) {
    console.error("SAM wallets GET error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wallets" },
      { status: 500 },
    );
  }
}
