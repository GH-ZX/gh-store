-- ============================================================
-- Migration 00009: Set Featured Products & Public Access
-- ============================================================

-- ─── Mark some products as featured for the carousel ─────
-- Set the first 5 active products (by sort_order) as featured
UPDATE public.products
SET is_featured = true
WHERE id IN (
  SELECT id FROM public.products
  WHERE status = 'active'
  ORDER BY sort_order ASC NULLS LAST, created_at DESC
  LIMIT 5
);

-- ─── Ensure public RLS for products (redundant but explicit) ──
-- Drop and recreate to ensure the policy exists
DROP POLICY IF EXISTS products_select_public ON public.products;
CREATE POLICY products_select_public ON public.products
  FOR SELECT
  USING (status = 'active');
