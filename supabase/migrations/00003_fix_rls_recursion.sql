-- ============================================================
-- GH-Store: Fix RLS infinite recursion on profiles table
-- Version: 00003
-- Date: July 28, 2026
-- ============================================================
--
-- The old profiles_select_admin policy used:
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
-- When evaluated on the profiles table itself, this creates infinite recursion.
--
-- Fix: Create a SECURITY DEFINER function that bypasses RLS,
--       then use it in the policy instead of a direct subquery.

-- ============================================================
-- 1. Create SECURITY DEFINER helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Fix profiles RLS policies
-- ============================================================
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;

CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- 3. (Optional) Update other admin policies for consistency
--    These don't have the recursion bug because they query
--    profiles FROM a different table's policy context, but
--    using the function is cleaner and avoids any future issues.
-- ============================================================

-- Products
DROP POLICY IF EXISTS products_all_admin ON public.products;
CREATE POLICY products_all_admin ON public.products
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Categories
DROP POLICY IF EXISTS categories_all_admin ON public.categories;
CREATE POLICY categories_all_admin ON public.categories
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Orders
DROP POLICY IF EXISTS orders_select_admin ON public.orders;
DROP POLICY IF EXISTS orders_all_admin ON public.orders;
CREATE POLICY orders_select_admin ON public.orders
  FOR SELECT
  USING (public.is_admin(auth.uid()));
CREATE POLICY orders_all_admin ON public.orders
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Wallets
DROP POLICY IF EXISTS wallets_select_admin ON public.wallet_balances;
DROP POLICY IF EXISTS wallets_all_admin ON public.wallet_balances;
CREATE POLICY wallets_select_admin ON public.wallet_balances
  FOR SELECT
  USING (public.is_admin(auth.uid()));
CREATE POLICY wallets_all_admin ON public.wallet_balances
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Audit logs
DROP POLICY IF EXISTS audit_logs_admin ON public.audit_logs;
CREATE POLICY audit_logs_admin ON public.audit_logs
  FOR ALL
  USING (public.is_admin(auth.uid()));
