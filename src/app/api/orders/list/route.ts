import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/utils/supabase";

/**
 * GET /api/orders/list
 *
 * Returns the authenticated user's orders with their items,
 * ordered by most recent first.
 *
 * Query params:
 *   - limit: number (default 20)
 *   - offset: number (default 0)
 *   - status: filter by order status (optional)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        subtotal,
        discount,
        total,
        payment_method,
        payment_status,
        notes,
        metadata,
        created_at,
        updated_at,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          dynamic_fields,
          status
        )
      `)
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Failed to list orders:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    // Get total count
    let countQuery = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if (statusFilter) {
      countQuery = countQuery.eq("status", statusFilter);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Order list error:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
