-- ============================================================
-- GH-Store: Wallet Transactions RLS Policies
-- Version: 00007
-- Date: July 28, 2026
-- ============================================================
--
-- The wallet_transactions table was created in migration 00001
-- without RLS policies. This migration adds them.

-- ============================================================
-- RLS: Wallet Transactions
-- ============================================================
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY tx_select_own ON public.wallet_transactions
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Admins can view all transactions
CREATE POLICY tx_select_admin ON public.wallet_transactions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert/update/delete transactions
CREATE POLICY tx_all_admin ON public.wallet_transactions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
