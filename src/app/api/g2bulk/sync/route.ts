import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getOrCreateCategory,
  upsertProduct,
  recordSyncLog,
} from "@/lib/services/g2bulk-sync.service";
import { resolveG2BulkApiKey, ensureG2BulkProvider } from "@/lib/services/g2bulk.service";
import { requireApiAdmin } from "@/lib/utils/api-auth";
import { createSupabaseAdminClient } from "@/lib/utils/supabase";
import { g2bulkSyncSchema } from "@/lib/validation/provider.schema";
import type { G2BulkGame } from "@/providers/g2bulk/types";

/**
 * POST /api/g2bulk/sync
 *
 * Sync selected voucher categories and games from G2Bulk into Supabase.
 *
 * Body:
 * {
 *   categories: number[],     // G2Bulk category IDs — each becomes ONE product with metadata.amounts[]
 *   products: number[],       // Individual product IDs (legacy, kept for granular sync)
 *   games: string[]           // Game codes — each becomes ONE product with metadata.catalogue[]
 * }
 *
 * This mirrors echocore-store's approach: voucher categories and games are
 * stored as single products with their pricing options in metadata.
 */

// ─── Helpers ──────────────────────────────────────────

async function testG2BulkConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.g2bulk.com/v1/getMe", {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, message: `HTTP ${res.status}: ${text || res.statusText}` };
    }
    // Deliberately does not echo the upstream account's name, username, or
    // balance — this message is returned to the browser.
    await res.json().catch(() => null);
    return { success: true, message: "Connected to G2Bulk successfully" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

// getOrCreateCategory / upsertProduct live in g2bulk-sync.service so this
// route and G2BulkProvider.syncCatalog() write products identically.

// ─── Route ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  const guard = await requireApiAdmin();
  if (guard.error) return guard.error;

  const syncStartedAt = Date.now();

  try {
    const parsed = g2bulkSyncSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    const { categories, products: productIds, games } = parsed.data;

    const supabase = createSupabaseAdminClient();
    const providerId = await ensureG2BulkProvider(supabase);

    const apiKey = await resolveG2BulkApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "G2Bulk API key not configured" },
        { status: 502 },
      );
    }

    const connection = await testG2BulkConnection(apiKey);
    if (!connection.success) {
      return NextResponse.json(
        { success: false, message: `G2Bulk connection failed: ${connection.message}` },
        { status: 502 },
      );
    }

    const results = {
      productsCreated: 0,
      productsUpdated: 0,
      categoriesCreated: 0,
      errors: [] as string[],
    };

    // ─── 1. Sync Voucher Categories ──────────────────
    // Each selected category becomes ONE product with its amounts in metadata.
    // This avoids creating 1171 individual products.
    if (categories && categories.length > 0) {
      try {
        const allProductsRes = await fetch("https://api.g2bulk.com/v1/products", {
          headers: { "X-API-Key": apiKey },
        });
        if (!allProductsRes.ok) {
          throw new Error(`Failed to fetch G2Bulk products (${allProductsRes.status})`);
        }

        const allProductsResult = await allProductsRes.json();
        const allProducts: Array<{
          id: number;
          category_id: number;
          category_title: string;
          title: string;
          unit_price: number;
          face_value: number | null;
          stock: number;
          is_active: boolean;
        }> = (allProductsResult?.products || []).map((p: Record<string, unknown>) => ({
          id: Number(p.id),
          category_id: Number(p.category_id),
          category_title: String(p.category_title || ""),
          title: String(p.title || p.name || ""),
          unit_price: Number(p.unit_price ?? p.price ?? 0),
          face_value: p.face_value != null ? Number(p.face_value) : null,
          stock: p.stock != null ? Number(p.stock) : -1,
          is_active: p.is_active !== false,
        }));

        // Filter by selected categories
        const selectedProducts = allProducts.filter((p) => categories.includes(p.category_id));

        // Group by category_id
        const catMap = new Map<number, {
          id: number;
          title: string;
          products: typeof selectedProducts;
        }>();

        for (const p of selectedProducts) {
          if (!catMap.has(p.category_id)) {
            catMap.set(p.category_id, {
              id: p.category_id,
              title: p.category_title || `Category ${p.category_id}`,
              products: [],
            });
          }
          catMap.get(p.category_id)!.products.push(p);
        }

        // Create ONE product per category
        for (const [catId, catGroup] of catMap) {
          try {
            const slug = `g2bulk-voucher-${catId}`;
            const category = catGroup.products[0];
            const minPrice = Math.min(...catGroup.products.map((p) => p.unit_price));
            const maxFaceValue = Math.max(
              ...catGroup.products.map((p) => p.face_value ?? 0),
              0,
            );

            // Sort amounts by unit_price
            const amounts = catGroup.products
              .sort((a, b) => a.unit_price - b.unit_price)
              .map((p) => ({
                id: p.id,
                title: p.title,
                unit_price: p.unit_price,
                face_value: p.face_value,
                stock: p.stock,
              }));

            // Get or create a store category based on voucher type
            const storeCatSlug = `vouchers`;
            const storeCat = await getOrCreateCategory(supabase, storeCatSlug, "قسائم", "Vouchers");
            if (storeCat.created) results.categoriesCreated++;

            const { created } = await upsertProduct(supabase, slug, {
              slug,
              category_id: storeCat.id,
              provider_id: providerId,
              name_ar: catGroup.title,
              name_en: catGroup.title,
              description_ar: `قسائم ${catGroup.title} — ${amounts.length} فئة سعرية`,
              description_en: `${catGroup.title} vouchers — ${amounts.length} price options`,
              image_url: null,
              base_price: minPrice,
              original_price: maxFaceValue > minPrice ? maxFaceValue : null,
              type: "gift_card",
              status: "active",
              provider_product_id: `g2bulk-cat-${catId}`,
              is_featured: false,
              sort_order: catId,
              metadata: {
                g2bulk_category_id: catId,
                amounts,
              },
            });

            if (created) results.productsCreated++;
            else results.productsUpdated++;
          } catch (err) {
            results.errors.push(
              `Category ${catId}: ${err instanceof Error ? err.message : "Unknown"}`,
            );
          }
        }
      } catch (err) {
        results.errors.push(
          `Category sync error: ${err instanceof Error ? err.message : "Unknown"}`,
        );
      }
    }

    // ─── 2. Sync Individual Products ────────────────
    if (productIds && productIds.length > 0) {
      try {
        const defaultCat = await getOrCreateCategory(supabase, "g2bulk-products", "منتجات G2Bulk", "G2Bulk Products");
        if (defaultCat.created) results.categoriesCreated++;

        for (const pid of productIds) {
          try {
            const productRes = await fetch(
              `https://api.g2bulk.com/v1/products/${pid}`,
              { headers: { "X-API-Key": apiKey } },
            );
            if (!productRes.ok) {
              results.errors.push(`Product ${pid}: HTTP ${productRes.status}`);
              continue;
            }

            const productResult = await productRes.json();
            const slug = `g2bulk-p-${productResult.id}`;

            const { created } = await upsertProduct(supabase, slug, {
              slug,
              category_id: defaultCat.id,
              provider_id: providerId,
              name_ar: productResult.title || "",
              name_en: productResult.title || "",
              description_ar: productResult.description || null,
              description_en: productResult.description || null,
              image_url: productResult.image || null,
              base_price: Number(productResult.unit_price ?? productResult.price ?? 0),
              original_price:
                productResult.face_value != null &&
                Number(productResult.face_value) > Number(productResult.unit_price ?? 0)
                  ? Number(productResult.face_value)
                  : null,
              type: "gift_card",
              status: productResult.is_active !== false ? "active" : "inactive",
              provider_product_id: String(productResult.id),
              is_featured: false,
              sort_order: productResult.id,
            });

            if (created) results.productsCreated++;
            else results.productsUpdated++;
          } catch (err) {
            results.errors.push(`Product ${pid}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }
      } catch (err) {
        results.errors.push(`Product sync error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // ─── 3. Sync Games (Top-Ups) ─────────────────────
    // Each game becomes ONE product with catalogue items in metadata.
    if (games && games.length > 0) {
      try {
        const allGamesRes = await fetch("https://api.g2bulk.com/v1/games", {
          headers: { "X-API-Key": apiKey },
        });
        const allGamesResult = allGamesRes.ok ? await allGamesRes.json() : {};
        const allGames: G2BulkGame[] = allGamesResult?.games || [];

        // Get or create the games store category
        const storeCatSlug = `games`;
        const storeCat = await getOrCreateCategory(supabase, storeCatSlug, "الألعاب", "Games");
        if (storeCat.created) results.categoriesCreated++;

        for (const gameCode of games) {
          try {
            const game = allGames.find((g) => g.code === gameCode);
            if (!game) {
              results.errors.push(`Game ${gameCode}: not found in G2Bulk`);
              continue;
            }

            // Fetch catalogue — API returns { catalogues: [...], game, success }
            const catRes = await fetch(
              `https://api.g2bulk.com/v1/games/${gameCode}/catalogue`,
              { headers: { "X-API-Key": apiKey } },
            );
            if (!catRes.ok) {
              results.errors.push(`Game ${gameCode}: failed to fetch catalogue (${catRes.status})`);
              continue;
            }

            const catalogueResult = await catRes.json();
            // The API key is "catalogues" (plural) and items have { id, name, amount }
            const catalogue: Array<{ id: number; name: string; amount: number }> =
              catalogueResult?.catalogues || [];

            const minPrice = catalogue.length > 0
              ? Math.min(...catalogue.map((item) => item.amount))
              : 0;
            const maxPrice = catalogue.length > 0
              ? Math.max(...catalogue.map((item) => item.amount))
              : 0;

            const slug = `g2bulk-game-${gameCode}`;

            const { created } = await upsertProduct(supabase, slug, {
              slug,
              category_id: storeCat.id,
              provider_id: providerId,
              name_ar: game.name,
              name_en: game.name,
              description_ar: game.description || `${game.name} — توب أب`,
              description_en: game.description || `${game.name} — Top-Up`,
              image_url: game.image_url || null,
              base_price: minPrice,
              original_price: null,
              type: "topup",
              status: "active",
              provider_product_id: `g2bulk-game-${gameCode}`,
              is_featured: false,
              sort_order: 0,
              metadata: {
                game_code: gameCode,
                game_name: game.name,
                game_image: game.image_url || null,
                catalogue: catalogue.map((item) => ({
                  id: item.id,
                  name: item.name,
                  amount: item.amount,
                })),
                // Standard top-up fields required by G2Bulk for ordering
                // Use camelCase keys to match StoreProduct.fields interface
                fields: [
                  { key: "player_id", labelAr: "معرف اللاعب (UID)", labelEn: "Player ID (UID)", type: "text", required: true },
                  { key: "server_id", labelAr: "الخادم (اختياري)", labelEn: "Server (optional)", type: "text", required: false },
                  { key: "charname", labelAr: "اسم الشخصية (اختياري)", labelEn: "Character Name (optional)", type: "text", required: false },
                ],
              },
            });

            if (created) results.productsCreated++;
            else results.productsUpdated++;
          } catch (err) {
            results.errors.push(`Game ${gameCode}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }
      } catch (err) {
        results.errors.push(`Game sync error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // ─── Response ─────────────────────────────────────
    const duration = Date.now() - syncStartedAt;
    const hasSuccess = results.productsCreated > 0 || results.productsUpdated > 0;
    const hasErrors = results.errors.length > 0;

    await recordSyncLog(supabase, {
      providerId,
      type: "manual",
      status: hasErrors && !hasSuccess ? "failed" : hasErrors ? "partial" : "completed",
      productsCreated: results.productsCreated,
      productsUpdated: results.productsUpdated,
      productsDeactivated: 0,
      errors: results.errors,
      startedAt: new Date(syncStartedAt).toISOString(),
    });

    return NextResponse.json({
      success: hasSuccess || !hasErrors,
      message: hasSuccess
        ? `Sync complete: ${results.productsCreated} created, ${results.productsUpdated} updated, ${results.categoriesCreated} categories (${duration}ms)`
        : hasErrors
          ? `Sync failed with ${results.errors.length} error(s)`
          : "Nothing to sync",
      results,
      duration,
    });
  } catch (err) {
    console.error("G2Bulk sync error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
