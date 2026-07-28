-- ============================================================
-- GH-Store: SAM API Provider Configuration
-- Version: 00005
-- Date: July 28, 2026
-- ============================================================
--
-- This migration adds a provider_config table for storing
-- advanced settings per payment provider (profit margin,
-- default wallet, webhook URL, etc.)

-- ============================================================
-- PROVIDER CONFIG (per-provider advanced settings)
-- ============================================================
CREATE TABLE public.provider_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  key               TEXT NOT NULL,
  value             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, key)
);

CREATE INDEX idx_provider_config_provider ON public.provider_config(provider_id);

-- ============================================================
-- TRIGGER: update updated_at
-- ============================================================
CREATE TRIGGER update_provider_config_updated_at
  BEFORE UPDATE ON public.provider_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS: Admins only
-- ============================================================
ALTER TABLE public.provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_config_admin ON public.provider_config
  FOR ALL
  USING (public.is_admin(auth.uid()));
