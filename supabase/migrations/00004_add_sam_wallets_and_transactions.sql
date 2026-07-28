-- ============================================================
-- GH-Store: SAM API Wallets & Transactions Tables
-- Version: 00004
-- Date: July 28, 2026
-- ============================================================
--
-- These tables cache data fetched from SAM API (ShamCash/Syriatel)
-- so it persists across page refreshes and reduces API calls.

-- ============================================================
-- SAM WALLETS
-- ============================================================
CREATE TABLE public.sam_wallets (
  id                    TEXT PRIMARY KEY,
  provider              TEXT NOT NULL,
  provider_display_name TEXT,
  label                 TEXT,
  phone                 TEXT,
  wallet_address        TEXT,
  account_number        TEXT,
  cash_code             TEXT,
  region                TEXT,
  status                TEXT NOT NULL DEFAULT 'active',
  balances              JSONB DEFAULT '[]'::jsonb,
  raw_data              JSONB DEFAULT '{}'::jsonb,
  last_synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sam_wallets_provider ON public.sam_wallets(provider);

-- ============================================================
-- SAM TRANSACTIONS
-- ============================================================
CREATE TABLE public.sam_transactions (
  id                    TEXT PRIMARY KEY,
  wallet_id             TEXT NOT NULL REFERENCES public.sam_wallets(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,
  amount                DECIMAL(12,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'USD',
  counterparty          TEXT,
  description           TEXT,
  status                TEXT,
  occurred_at           TIMESTAMPTZ NOT NULL,
  raw_data              JSONB DEFAULT '{}'::jsonb,
  last_synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sam_transactions_wallet ON public.sam_transactions(wallet_id, occurred_at DESC);
CREATE INDEX idx_sam_transactions_occurred ON public.sam_transactions(occurred_at DESC);

-- ============================================================
-- TRIGGER: update updated_at
-- ============================================================
CREATE TRIGGER update_sam_wallets_updated_at
  BEFORE UPDATE ON public.sam_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS: Admins only (these contain payment provider data)
-- ============================================================
ALTER TABLE public.sam_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sam_wallets_admin ON public.sam_wallets
  FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY sam_transactions_admin ON public.sam_transactions
  FOR ALL
  USING (public.is_admin(auth.uid()));
