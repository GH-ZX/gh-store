-- ============================================================
-- GH-Store: Security hardening
-- Version: 00010
-- Date: July 28, 2026
-- ============================================================
--
-- Closes five classes of issue found in the security audit:
--
--   1. 17 tables were created without RLS. The worst is
--      provider_credentials, which stores G2Bulk/SAM API keys and webhook
--      secrets in plaintext — readable by anyone holding the public anon key.
--   2. `WITH CHECK (true)` INSERT policies on orders/order_items/
--      order_status_history granted INSERT to anon. The service role bypasses
--      RLS and never needed a policy; these only ever widened access, and
--      because policies are OR'd they silently overrode orders_insert_own.
--   3. SECURITY DEFINER functions took a caller-supplied p_profile_id with no
--      auth.uid() check, and lacked `SET search_path`. A negative p_amount
--      turned the balance check into a credit.
--   4. No EXECUTE grants were ever revoked, so every RPC was callable by anon.
--   5. save_sam_api_settings inserted into providers without the NOT NULL
--      `type` column, so it failed unconditionally.

-- ============================================================
-- 1. Enable RLS on every table that was missing it
-- ============================================================
ALTER TABLE public.providers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_credentials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_dynamic_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Credentials: admin-only, no anon access whatsoever
-- ============================================================
-- No policy grants SELECT to non-admins. Server code reaches this table
-- exclusively through the service-role client, which bypasses RLS.
DROP POLICY IF EXISTS provider_credentials_admin ON public.provider_credentials;
CREATE POLICY provider_credentials_admin ON public.provider_credentials
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS providers_select_public ON public.providers;
CREATE POLICY providers_select_public ON public.providers
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS providers_admin ON public.providers;
CREATE POLICY providers_admin ON public.providers
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 3. Public catalogue data: readable by all, writable by admins
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'product_attributes', 'product_dynamic_fields', 'product_pricing',
    'inventory', 'homepage_banners', 'navigation_items',
    'website_settings', 'theme_settings', 'seo_settings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select_public ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select_public ON public.%I FOR SELECT USING (true)', t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_admin ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_admin ON public.%I FOR ALL '
      'USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 4. Admin-only operational tables
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sync_logs', 'activity_logs', 'coupon_products']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_admin ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_admin ON public.%I FOR ALL '
      'USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 5. Coupons — users may read active coupons to validate a code,
--    but must not enumerate usage records belonging to others
-- ============================================================
DROP POLICY IF EXISTS coupons_select_active ON public.coupons;
CREATE POLICY coupons_select_active ON public.coupons
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS coupons_admin ON public.coupons;
CREATE POLICY coupons_admin ON public.coupons
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS coupon_usage_select_own ON public.coupon_usage;
CREATE POLICY coupon_usage_select_own ON public.coupon_usage
  FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS coupon_usage_admin ON public.coupon_usage;
CREATE POLICY coupon_usage_admin ON public.coupon_usage
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 6. Reviews — public read, authors write their own
-- ============================================================
-- Only approved reviews are public; authors can always see their own.
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT
  USING (is_approved = true OR auth.uid() = profile_id);

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS reviews_admin ON public.reviews;
CREATE POLICY reviews_admin ON public.reviews
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 7. Remove the `WITH CHECK (true)` INSERT policies
-- ============================================================
-- The service-role client bypasses RLS entirely, so dropping these removes
-- anon's ability to forge orders without affecting server-side inserts.
DROP POLICY IF EXISTS orders_insert_service       ON public.orders;
DROP POLICY IF EXISTS order_items_insert_service  ON public.order_items;
DROP POLICY IF EXISTS order_history_insert_service ON public.order_status_history;

-- Users may still create their own orders directly (orders_insert_own from
-- 00001 covers this); recreate it defensively in case it was dropped.
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- ============================================================
-- 8. profiles: allow self-update but never self-promotion
-- ============================================================
-- use-auth.ts performs a client-side profiles.update(). Without a column
-- guard, that same path would let any customer set role = 'admin'.
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 8b. wallet_transactions: use is_admin() and add the missing WITH CHECK
-- ============================================================
-- 00007 reintroduced the recursive-subquery pattern that 00003 replaced, and
-- tx_all_admin was FOR ALL with a USING clause but no WITH CHECK — leaving
-- INSERT/UPDATE unconstrained for the rows it permitted.
DROP POLICY IF EXISTS tx_select_admin ON public.wallet_transactions;
CREATE POLICY tx_select_admin ON public.wallet_transactions
  FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS tx_all_admin ON public.wallet_transactions;
CREATE POLICY tx_all_admin ON public.wallet_transactions
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- 9. Harden the money-moving RPCs
-- ============================================================
-- Drop the previous deduct_wallet_balance signature FIRST. The hardened
-- version below types p_reference_id as UUID (matching
-- wallet_transactions.reference_id) instead of TEXT, so CREATE OR REPLACE
-- would register an *overload* and leave the vulnerable original callable
-- via PostgREST.
DROP FUNCTION IF EXISTS public.deduct_wallet_balance(UUID, DECIMAL, TEXT, TEXT, TEXT);

-- deduct_wallet_balance: pin search_path, reject non-positive amounts, and
-- require the caller to be the wallet owner (or the service role, whose
-- auth.uid() is NULL because it presents no user JWT).
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_profile_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance DECIMAL;
  v_version INTEGER;
  v_new_version INTEGER;
  v_caller UUID;
BEGIN
  v_caller := auth.uid();

  -- auth.uid() IS NULL means the service role (trusted server code).
  IF v_caller IS NOT NULL AND v_caller <> p_profile_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- A negative amount previously passed the `v_balance < p_amount` check and
  -- then *credited* the wallet via `balance - (-x)`.
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT balance, version INTO v_balance, v_version
  FROM public.wallet_balances
  WHERE profile_id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet_not_found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  UPDATE public.wallet_balances
  SET balance = balance - p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE profile_id = p_profile_id
    AND version = v_version
  RETURNING balance, version INTO v_balance, v_new_version;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_update');
  END IF;

  INSERT INTO public.wallet_transactions (
    profile_id, type, amount, balance_before, balance_after,
    description, reference_type, reference_id
  ) VALUES (
    p_profile_id, 'purchase', -p_amount, v_balance + p_amount, v_balance,
    p_description, p_reference_type, p_reference_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance,
    'version', v_new_version
  );
END;
$$;

-- credit_wallet_balance: the counterpart used by the SAM top-up webhook.
-- Service-role only — there is no legitimate caller-initiated credit path.
CREATE OR REPLACE FUNCTION public.credit_wallet_balance(
  p_profile_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance DECIMAL;
  v_version INTEGER;
  v_new_balance DECIMAL;
BEGIN
  -- Only trusted server code (service role, auth.uid() IS NULL) may credit.
  IF auth.uid() IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  -- Idempotency: never apply the same reference twice. Without this a
  -- replayed webhook would credit the wallet on every delivery.
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE reference_id = p_reference_id
      AND reference_type = p_reference_type
      AND type = 'deposit'
  ) THEN
    RETURN jsonb_build_object('success', true, 'error', 'already_applied');
  END IF;

  SELECT balance, version INTO v_balance, v_version
  FROM public.wallet_balances
  WHERE profile_id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallet_balances (profile_id, balance)
    VALUES (p_profile_id, 0)
    RETURNING balance, version INTO v_balance, v_version;
  END IF;

  UPDATE public.wallet_balances
  SET balance = balance + p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE profile_id = p_profile_id
    AND version = v_version
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_update');
  END IF;

  INSERT INTO public.wallet_transactions (
    profile_id, type, amount, balance_before, balance_after,
    description, reference_type, reference_id
  ) VALUES (
    p_profile_id, 'deposit', p_amount, v_new_balance - p_amount, v_new_balance,
    p_description, p_reference_type, p_reference_id
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- update_order_status: admin or service-role only.
-- Keeps the original signature (p_new_status is the `order_status` enum, and
-- p_payment_status is still accepted) so existing callers keep working — the
-- change here is the authorization check and the pinned search_path.
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status order_status,
  p_payment_status TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_status public.order_status;
  v_caller UUID;
BEGIN
  v_caller := auth.uid();

  IF v_caller IS NOT NULL AND NOT public.is_admin(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF p_payment_status IS NOT NULL
     AND p_payment_status NOT IN ('pending', 'paid', 'failed', 'refunded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_payment_status');
  END IF;

  SELECT status INTO v_old_status FROM public.orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      payment_status = COALESCE(p_payment_status, payment_status),
      updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, old_status, new_status, reason)
  VALUES (p_order_id, v_old_status, p_new_status, p_reason);

  RETURN jsonb_build_object('success', true, 'old_status', v_old_status);
END;
$$;

-- generate_order_number was missing search_path pinning.
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_date TEXT;
  v_seq INTEGER;
BEGIN
  v_date := to_char(NOW(), 'YYYYMMDD');
  PERFORM pg_advisory_xact_lock(hashtext('order_seq_' || v_date));

  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 12) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM public.orders
  WHERE order_number LIKE 'GH-' || v_date || '-%';

  RETURN 'GH-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 10. Fix save_sam_api_settings — providers.type is NOT NULL
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_sam_api_settings(
  p_api_key TEXT DEFAULT NULL,
  p_regenerate_webhook BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_provider_id UUID;
  v_secret TEXT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  SELECT id INTO v_provider_id FROM public.providers WHERE slug = 'sam-api';

  IF v_provider_id IS NULL THEN
    -- `type` was omitted here, so this INSERT failed the NOT NULL constraint
    -- every time the provider row did not already exist.
    INSERT INTO public.providers (name, slug, type, description, is_active)
    VALUES ('SAM API', 'sam-api', 'payment',
            'ShamCash & Syriatel Cash payment gateway', true)
    RETURNING id INTO v_provider_id;
  END IF;

  IF p_api_key IS NOT NULL AND p_api_key != '' THEN
    DELETE FROM public.provider_credentials
    WHERE provider_id = v_provider_id AND key = 'api_key';

    INSERT INTO public.provider_credentials (provider_id, key, value, is_active)
    VALUES (v_provider_id, 'api_key', p_api_key, true);
  END IF;

  IF p_regenerate_webhook THEN
    v_secret := public.generate_webhook_secret();

    DELETE FROM public.provider_credentials
    WHERE provider_id = v_provider_id AND key = 'webhook_secret';

    INSERT INTO public.provider_credentials (provider_id, key, value, is_active)
    VALUES (v_provider_id, 'webhook_secret', v_secret, true);
  END IF;

  RETURN jsonb_build_object('success', true, 'provider_id', v_provider_id);
END;
$$;

-- ============================================================
-- 11. Revoke RPC execution from untrusted roles
-- ============================================================
-- PostgreSQL grants EXECUTE to PUBLIC on new functions by default, which
-- PostgREST exposes as callable RPC endpoints to anon/authenticated.
REVOKE ALL ON FUNCTION public.credit_wallet_balance(UUID, DECIMAL, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_order_status(UUID, order_status, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_order_number()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_sam_api_settings(TEXT, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_webhook_secret()
  FROM PUBLIC, anon, authenticated;

-- deduct_wallet_balance stays callable by authenticated users: it now verifies
-- auth.uid() = p_profile_id internally and rejects non-positive amounts.
REVOKE ALL ON FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT, TEXT, UUID)
  TO authenticated;

-- is_admin is a read-only predicate used inside policies.
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ============================================================
-- 12. Index supporting the SAM webhook's invoice lookup
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_sam_invoice
  ON public.orders ((metadata->>'sam_invoice_id'));
