-- ============================================================
-- GH-Store: Initial Schema Migration
-- Version: 00001
-- Date: July 28, 2026
-- ============================================================

-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'admin')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================================
-- WALLET
-- ============================================================
CREATE TABLE public.wallet_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id)
);

CREATE TABLE public.wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'refund', 'admin_adjustment')),
  amount          DECIMAL(12,2) NOT NULL,
  balance_before  DECIMAL(12,2) NOT NULL,
  balance_after   DECIMAL(12,2) NOT NULL,
  reference_type  TEXT,
  reference_id    UUID,
  description     TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_profile ON public.wallet_transactions(profile_id, created_at DESC);
CREATE INDEX idx_wallet_tx_type ON public.wallet_transactions(type);

-- ============================================================
-- CATEGORIES (self-referential)
-- ============================================================
CREATE TABLE public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description_ar  TEXT,
  description_en  TEXT,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- ============================================================
-- PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('product', 'payment', 'fulfillment', 'hybrid')),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  config          JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.provider_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, key)
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  provider_id     UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description_ar  TEXT,
  description_en  TEXT,
  image_url       TEXT,
  type            TEXT NOT NULL DEFAULT 'topup'
                    CHECK (type IN ('topup', 'gift_card', 'redeem_code', 'license',
                                    'vpn', 'streaming', 'ai_subscription',
                                    'game_account', 'digital_product')),
  base_price      DECIMAL(12,2) NOT NULL CHECK (base_price >= 0),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
  provider_product_id TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_provider ON public.products(provider_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_type ON public.products(type);

-- ============================================================
-- PRODUCT ATTRIBUTES, FIELDS, PRICING, INVENTORY
-- ============================================================
CREATE TABLE public.product_attributes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  value_ar        TEXT NOT NULL,
  value_en        TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, key)
);
CREATE INDEX idx_product_attrs_product ON public.product_attributes(product_id);

CREATE TABLE public.product_dynamic_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  field_key       TEXT NOT NULL,
  label_ar        TEXT NOT NULL,
  label_en        TEXT NOT NULL,
  field_type      TEXT NOT NULL DEFAULT 'text'
                    CHECK (field_type IN ('text', 'number', 'email', 'password',
                                          'select', 'uid', 'server', 'region')),
  is_required     BOOLEAN NOT NULL DEFAULT true,
  placeholder_ar  TEXT,
  placeholder_en  TEXT,
  options         JSONB DEFAULT '[]'::jsonb,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, field_key)
);
CREATE INDEX idx_product_fields_product ON public.product_dynamic_fields(product_id);

CREATE TABLE public.product_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity    INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity > 0),
  max_quantity    INTEGER,
  unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  wholesale_price DECIMAL(12,2),
  UNIQUE(product_id, min_quantity)
);
CREATE INDEX idx_product_pricing_product ON public.product_pricing(product_id);

CREATE TABLE public.inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  quantity        INTEGER NOT NULL DEFAULT -1,
  reserved        INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COUPONS (must exist before orders reference them)
-- ============================================================
CREATE TABLE public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value  DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  min_purchase    DECIMAL(12,2) DEFAULT 0,
  max_discount    DECIMAL(12,2),
  usage_limit     INTEGER,
  usage_count     INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  starts_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;

CREATE TABLE public.coupon_products (
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, product_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TYPE order_status AS ENUM (
  'pending', 'processing', 'awaiting_payment', 'paid',
  'fulfilling', 'completed', 'refunded', 'partially_refunded',
  'cancelled', 'failed'
);

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT NOT NULL UNIQUE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status          order_status NOT NULL DEFAULT 'pending',
  subtotal        DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  discount        DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total           DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  payment_method  TEXT NOT NULL,
  payment_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  coupon_id       UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  notes           TEXT,
  billing_data    JSONB DEFAULT '{}'::jsonb,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_profile ON public.orders(profile_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS & STATUS HISTORY
-- ============================================================
CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price     DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  provider_data   JSONB DEFAULT '{}'::jsonb,
  dynamic_fields  JSONB DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'fulfilling', 'completed', 'failed', 'refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

CREATE TABLE public.order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status      order_status,
  new_status      order_status NOT NULL,
  changed_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_history_order ON public.order_status_history(order_id, created_at DESC);

-- ============================================================
-- COUPON USAGE
-- ============================================================
CREATE TABLE public.coupon_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_amount DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_profile ON public.coupon_usage(profile_id);

-- ============================================================
-- SYNC LOGS
-- ============================================================
CREATE TABLE public.sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('manual', 'scheduled', 'webhook')),
  status          TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  products_created  INTEGER NOT NULL DEFAULT 0,
  products_updated  INTEGER NOT NULL DEFAULT 0,
  products_deactivated INTEGER NOT NULL DEFAULT 0,
  errors          JSONB DEFAULT '[]'::jsonb,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER
);
CREATE INDEX idx_sync_logs_provider ON public.sync_logs(provider_id, started_at DESC);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE public.website_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name       TEXT NOT NULL DEFAULT 'GH-Store',
  site_description TEXT,
  logo_url        TEXT,
  favicon_url     TEXT,
  primary_locale  TEXT NOT NULL DEFAULT 'ar',
  supported_locales TEXT[] NOT NULL DEFAULT '{ar,en}',
  currency        TEXT NOT NULL DEFAULT 'USD',
  contact_email   TEXT,
  contact_phone   TEXT,
  address         TEXT,
  social_links    JSONB DEFAULT '{}'::jsonb,
  metadata        JSONB DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.website_settings (id) VALUES (gen_random_uuid());

CREATE TABLE public.theme_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_theme    TEXT NOT NULL DEFAULT 'default',
  themes_config   JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_css      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.theme_settings (id) VALUES (gen_random_uuid());

CREATE TABLE public.seo_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path       TEXT NOT NULL UNIQUE,
  title_ar        TEXT,
  title_en        TEXT,
  description_ar  TEXT,
  description_en  TEXT,
  keywords_ar     TEXT,
  keywords_en     TEXT,
  og_image_url    TEXT,
  is_custom       BOOLEAN NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seo_path ON public.seo_settings(page_path);

-- ============================================================
-- HOMEPAGE BANNERS
-- ============================================================
CREATE TABLE public.homepage_banners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  subtitle_ar     TEXT,
  subtitle_en     TEXT,
  image_url       TEXT NOT NULL,
  link_url        TEXT,
  link_text_ar    TEXT,
  link_text_en    TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NAVIGATION
-- ============================================================
CREATE TABLE public.navigation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES public.navigation_items(id) ON DELETE SET NULL,
  label_ar        TEXT NOT NULL,
  label_en        TEXT NOT NULL,
  link_type       TEXT NOT NULL CHECK (link_type IN ('page', 'category', 'product', 'custom')),
  link_value      TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_profile ON public.audit_logs(profile_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

CREATE TABLE public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  source          TEXT NOT NULL,
  message         TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_level ON public.activity_logs(level, created_at DESC);
CREATE INDEX idx_activity_logs_source ON public.activity_logs(source, created_at DESC);

-- ============================================================
-- CUSTOMER REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT,
  content_ar      TEXT,
  content_en      TEXT,
  is_approved     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, product_id),
  UNIQUE(profile_id, order_id)
);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.wallet_balances (profile_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select_public ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY products_all_admin ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_select_public ON public.categories FOR SELECT USING (true);
CREATE POLICY categories_all_admin ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own ON public.orders FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY orders_select_admin ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY orders_insert_own ON public.orders FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY orders_all_admin ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_select_own ON public.wallet_balances FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY wallets_select_admin ON public.wallet_balances FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY wallets_all_admin ON public.wallet_balances FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin ON public.audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
