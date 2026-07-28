-- ============================================================
-- GH-Store: Add product display fields
-- Version: 00002
-- Date: July 28, 2026
-- ============================================================

-- Add original_price for discount display (nullable — only set when on sale)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2)
    CHECK (original_price >= 0);

-- Add rating (1.0–5.0 scale, nullable until reviews exist)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1)
    CHECK (rating >= 0 AND rating <= 5);

-- Add review_count (nullable until reviews exist)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS review_count INTEGER
    CHECK (review_count >= 0);

COMMENT ON COLUMN public.products.original_price IS 'Original price before discount. NULL means no discount.';
COMMENT ON COLUMN public.products.rating IS 'Average customer rating (1.0–5.0).';
COMMENT ON COLUMN public.products.review_count IS 'Number of customer reviews.';
