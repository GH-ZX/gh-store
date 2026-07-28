import { NextResponse } from "next/server";
import { resolveG2BulkApiKey } from "@/lib/services/g2bulk.service";

/**
 * GET /api/g2bulk/catalog
 *
 * Proxies G2Bulk products and games data to the client.
 * The API key stays on the server — the client never sees it.
 */
export async function GET() {
  try {
    const apiKey = await resolveG2BulkApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "G2Bulk API key not configured" },
        { status: 500 },
      );
    }

    // Fetch products and games in parallel
    const headers = {
      "X-API-Key": apiKey,
      "Accept": "application/json",
    };

    const [productsRes, gamesRes, userRes] = await Promise.all([
      fetch("https://api.g2bulk.com/v1/products", { headers }),
      fetch("https://api.g2bulk.com/v1/games", { headers }),
      fetch("https://api.g2bulk.com/v1/getMe", { headers }),
    ]);

    // G2Bulk API wraps items inside { success, products/games } objects
    const productsResult = productsRes.ok ? await productsRes.json() : {};
    const gamesResult = gamesRes.ok ? await gamesRes.json() : {};
    const games = gamesResult?.games || [];
    const allProducts = productsResult?.products || [];

    // Group individual products into voucher categories
    // Each category has: id, title, count, minPrice, maxPrice, currency, products
    const categoryMap = new Map<number, {
      id: number;
      title: string;
      count: number;
      minPrice: number;
      maxPrice: number;
      currency: string;
      products: Array<{
        id: number;
        title: string;
        unit_price: number;
        face_value: number | null;
        stock: number;
      }>;
    }>();

    for (const p of allProducts) {
      const catId = p.category_id;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          title: p.category_title || `Category ${catId}`,
          count: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
          currency: "USD",
          products: [],
        });
      }
      const cat = categoryMap.get(catId)!;
      cat.count++;
      cat.minPrice = Math.min(cat.minPrice, p.unit_price ?? 0);
      cat.maxPrice = Math.max(cat.maxPrice, p.unit_price ?? 0);
      cat.products.push({
        id: p.id,
        title: p.title || "",
        unit_price: p.unit_price ?? 0,
        face_value: p.face_value || null,
        stock: p.stock ?? -1,
      });
    }

    // Convert to array and fix Infinities for empty categories
    const voucherCategories = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      minPrice: cat.count > 0 ? cat.minPrice : 0,
      maxPrice: cat.count > 0 ? cat.maxPrice : 0,
    }));

    // Normalize game fields — API returns `image_url` not `image`, make sure it passes through
    const normalizedGames = (games || []).map((g: Record<string, unknown>) => ({
      code: g.code,
      name: g.name,
      description: g.description || null,
      image_url: g.image_url || null,
      region: g.region || null,
    }));

    // Also fetch user info for connection status
    const user = userRes.ok ? await userRes.json() : null;

    return NextResponse.json({
      success: true,
      user: user
        ? {
            username: user.username,
            firstName: user.first_name,
            balance: user.balance,
          }
        : null,
      voucherCategories,
      games: normalizedGames,
      counts: {
        products: voucherCategories.length,
        totalItems: allProducts.length,
        games: games.length,
      },
    });
  } catch (err) {
    console.error("G2Bulk catalog fetch error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch catalog",
        products: [],
        games: [],
      },
      { status: 502 },
    );
  }
}
