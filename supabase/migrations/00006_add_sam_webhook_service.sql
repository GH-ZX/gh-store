-- ============================================================
-- GH-Store: SAM API Webhook Secret & Edge Function Support
-- Version: 00006
-- Date: July 28, 2026
-- ============================================================
--
-- Adds RPC functions for managing SAM API webhook secret
-- and a function to get the supabase URL for webhook generation.

-- ============================================================
-- Helper: generate a UUID-based webhook secret
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT encode(gen_random_bytes(32), 'hex')
$$;

-- ============================================================
-- Update provider_credentials to allow webhook_secret key
-- (Table already has: provider_id, key, value, is_active, created_at, updated_at)
-- Just add a note comment for clarity.
-- ============================================================
COMMENT ON TABLE public.provider_credentials IS
  'Stores provider credentials + webhook secrets. Keys: api_key, webhook_secret';

-- ============================================================
-- RPC: Save SAM API settings (including webhook secret regeneration)
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
  v_supabase_url TEXT;
  v_webhook_url TEXT;
  v_result JSONB;
BEGIN
  -- Get or create SAM provider
  SELECT id INTO v_provider_id
  FROM public.providers
  WHERE slug = 'sam-api';

  IF v_provider_id IS NULL THEN
    INSERT INTO public.providers (name, slug, description, is_active)
    VALUES ('SAM API', 'sam-api', 'ShamCash & Syriatel Cash payment gateway', true)
    RETURNING id INTO v_provider_id;
  END IF;

  -- Save API key if provided
  IF p_api_key IS NOT NULL AND p_api_key != '' THEN
    DELETE FROM public.provider_credentials
    WHERE provider_id = v_provider_id AND key = 'api_key';

    INSERT INTO public.provider_credentials (provider_id, key, value, is_active)
    VALUES (v_provider_id, 'api_key', p_api_key, true);
  END IF;

  -- Regenerate webhook secret if requested
  IF p_regenerate_webhook THEN
    v_secret := public.generate_webhook_secret();

    DELETE FROM public.provider_credentials
    WHERE provider_id = v_provider_id AND key = 'webhook_secret';

    INSERT INTO public.provider_credentials (provider_id, key, value, is_active)
    VALUES (v_provider_id, 'webhook_secret', v_secret, true);
  END IF;

  -- Build result
  SELECT value INTO v_secret
  FROM public.provider_credentials
  WHERE provider_id = v_provider_id AND key = 'webhook_secret' AND is_active = true
  LIMIT 1;

  -- Get supabase URL from the project
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://rbabtwjkqqzsbshzsgvz.supabase.co';
  END IF;

  IF v_secret IS NOT NULL THEN
    v_webhook_url := v_supabase_url || '/functions/v1/sam-api?token=' || v_secret;
  ELSE
    v_webhook_url := NULL;
  END IF;

  v_result := jsonb_build_object(
    'key_set', (SELECT EXISTS(SELECT 1 FROM public.provider_credentials WHERE provider_id = v_provider_id AND key = 'api_key' AND is_active = true)),
    'webhook_url', v_webhook_url,
    'webhook_set', v_secret IS NOT NULL
  );

  RETURN v_result;
END;
$$;
