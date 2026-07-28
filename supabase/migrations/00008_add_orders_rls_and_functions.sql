-- ============================================================
-- Migration 00008: Orders RLS + Order Number Function
-- ============================================================

-- ─── Generate Order Number ──────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date TEXT;
  v_seq INTEGER;
  v_number TEXT;
BEGIN
  v_date := to_char(NOW(), 'YYYYMMDD');
  
  -- Get next sequence for today
  PERFORM pg_advisory_xact_lock(hashtext('order_seq_' || v_date));
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 12) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM public.orders
  WHERE order_number LIKE 'GH-' || v_date || '-%';
  
  v_number := 'GH-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- ─── RLS: Enable on tables ─────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- ─── RLS: orders ──────────────────────────────────────
-- Customers can only see their own orders
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Admins can see all orders
CREATE POLICY orders_select_admin ON public.orders
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role (admin client) can insert orders
CREATE POLICY orders_insert_service ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Admins can update orders (change status, etc.)
CREATE POLICY orders_update_admin ON public.orders
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─── RLS: order_items ──────────────────────────────────
-- Customers can see items of their own orders
CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.profile_id = auth.uid()
    )
  );

-- Admins can see all order items
CREATE POLICY order_items_select_admin ON public.order_items
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role can insert order items
CREATE POLICY order_items_insert_service ON public.order_items
  FOR INSERT
  WITH CHECK (true);

-- Admins can update order items
CREATE POLICY order_items_update_admin ON public.order_items
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─── RLS: order_status_history ─────────────────────────
-- Customers can see history of their own orders
CREATE POLICY order_history_select_own ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
        AND orders.profile_id = auth.uid()
    )
  );

-- Admins can see all order history
CREATE POLICY order_history_select_admin ON public.order_status_history
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Service role can insert order history
CREATE POLICY order_history_insert_service ON public.order_status_history
  FOR INSERT
  WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- Wallet balance deduction RPC (for wallet payments)
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_profile_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_version INTEGER;
  v_new_version INTEGER;
  v_success BOOLEAN;
BEGIN
  -- Check current balance with optimistic lock
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

  -- Deduct with version check (optimistic locking)
  UPDATE public.wallet_balances
  SET
    balance = balance - p_amount,
    version = version + 1,
    updated_at = NOW()
  WHERE profile_id = p_profile_id
    AND version = v_version
  RETURNING balance, version INTO v_balance, v_new_version;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'concurrent_update');
  END IF;

  -- Record transaction
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

-- ════════════════════════════════════════════════════════
-- Update order status + insert history
-- ════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status order_status,
  p_payment_status TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status order_status;
  v_result JSONB;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  -- Update order
  UPDATE public.orders
  SET
    status = p_new_status,
    payment_status = COALESCE(p_payment_status, payment_status),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Insert history
  INSERT INTO public.order_status_history (
    order_id, old_status, new_status, reason
  ) VALUES (
    p_order_id, v_old_status, p_new_status, p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;
