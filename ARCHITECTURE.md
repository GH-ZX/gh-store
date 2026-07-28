# GH-Store — Software Architecture Document

> **Version:** 1.1.0  
> **Author:** Senior Staff Software Architect  
> **Status:** Draft — Pending Approval  
> **Date:** July 28, 2026

---

## Table of Contents

1. [Overall System Architecture](#1-overall-system-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema & Relationships](#3-database-schema--relationships)
4. [Authentication Flow](#4-authentication-flow)
5. [Authorization (RBAC)](#5-authorization-rbac)
6. [API Provider Architecture](#6-api-provider-architecture)
7. [Synchronization Strategy](#7-synchronization-strategy)
8. [Dashboard Architecture](#8-dashboard-architecture)
9. [State Management](#9-state-management)
10. [UI Architecture](#10-ui-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Security Architecture](#12-security-architecture)
13. [Environment Variables](#13-environment-variables)
14. [Development Roadmap](#14-development-roadmap)

---

## Version Matrix (July 2026)

| Package                      | Version    | Notes                                                          |
| ---------------------------- | ---------- | -------------------------------------------------------------- |
| **Next.js**                  | `16.2.12`  | Active LTS — App Router is default                             |
| **React**                    | `19.2.8`   | Server Components, Actions stable                              |
| **TypeScript**               | `7.0.2`    | Major jump from 5.x — new syntax features                      |
| **Tailwind CSS**             | `4.3.3`    | v4 is standard — CSS-first config                              |
| **shadcn/ui (CLI)**          | `4.x`      | Uses **Base UI** by default (MUI team) — best for new projects |
| **TanStack Query**           | `5.101.4`  | Server state management                                        |
| **Zod**                      | `4.4.3`    | Breaking from v3 — new validation API                          |
| **React Hook Form**          | `7.83.0`   | Stable, well-supported                                         |
| **@supabase/supabase-js**    | `2.110.9`  | Latest SDK                                                     |
| **@supabase/ssr**            | `0.12.3`   | SSR auth helpers                                               |
| **next-intl**                | `4.13.3`   | Internationalization                                           |
| **zustand**                  | `5.0.14`   | Breaking: stores are flat now                                  |
| **recharts**                 | `3.10.1`   | v3 — breaking changes from v2                                  |
| **lucide-react**             | `1.27.0`   | Icons                                                          |
| **class-variance-authority** | `0.7.1`    | Variants API                                                   |
| **clsx**                     | `2.1.1`    | Classname utility                                              |
| **tailwind-merge**           | `3.6.0`    | Class merging                                                  |
| **Supabase CLI**             | `2.110.0`  | Database migrations + Edge Functions                           |
| **Node.js**                  | `22.x` LTS | Required for Next.js 16 — pin via `.nvmrc`                     |

---

## 1. Overall System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare Pages                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Next.js 16 (App Router)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │ │
│  │  │ Storefront│  │ Dashboard│  │    Provider Adapters  │  │ │
│  │  │ (Public)  │  │ (Admin)  │  │   (Server Actions)    │  │ │
│  │  └─────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │ │
│  │        │              │                    │              │ │
│  │  ┌─────┴──────────────┴────────────────────┴───────────┐ │ │
│  │  │              Service Layer (Server-side)              │ │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │ │
│  │  │  │ Auth       │  │ Orders     │  │ Synchronization  │  │ │ │
│  │  │  │ Service    │  │ Service    │  │ Engine           │  │ │ │
│  │  │  └──────────┘  └──────────┘  └──────────────────┘  │ │ │
│  │  │  └──────────┘  └──────────┘  └──────────────────┘  │ │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │ │
│  │  │  │ Wallet   │  │ Payment  │  │ Provider         │  │ │ │
│  │  │  │ Service  │  │ Service  │  │ Registry         │  │ │ │
│  │  │  └──────────┘  └──────────┘  └──────────────────┘  │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│              ┌───────────────┴───────────────┐                │
│              │       Supabase (Backend)       │                │
│              │  ┌──────────────────────────┐  │                │
│              │  │     PostgreSQL Database   │  │                │
│              │  ├──────────────────────────┤  │                │
│              │  │     Supabase Auth         │  │                │
│              │  ├──────────────────────────┤  │                │
│              │  │     Supabase Realtime     │  │                │
│              │  ├──────────────────────────┤  │                │
│              │  │  Edge Functions (Sync)    │  │                │
│              │  └──────────────────────────┘  │                │
│              └────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  ┌─────────────┐              ┌──────────────────┐
  │  G2Bulk API  │              │   SAM API        │
  │  (Provider)  │              │   (Payment)      │
  └─────────────┘              └──────────────────┘
```

### 1.2 Architectural Principles

| Principle                    | Application                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Separation of Concerns**   | Business logic never lives inside React components. All logic is in services.                         |
| **Provider Adapter Pattern** | Every external provider is a plugin. Adding a provider requires zero changes to business logic.       |
| **Clean Architecture**       | Layers: UI → Use Cases → Services → Data Access. Dependencies point inward.                           |
| **SOLID Principles**         | Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. |
| **Type Safety**              | Strict TypeScript throughout. Zod schemas validate all boundaries.                                    |
| **Server-First**             | Server Actions and Server Components are the default. Client components are opt-in.                   |

### 1.3 Request Flow

```
User Request
    │
    ▼
Next.js App Router (middleware.ts)
    │
    ├──→ Public Route? → Server Component → Render
    │
    ├──→ Auth Required? → Supabase Auth Check → Redirect if unauthorized
    │
    ├──→ Admin Route? → RBAC Check → 403 if unauthorized
    │
    ▼
Server Action / API Route
    │
    ▼
Service Layer (validation via Zod)
    │
    ▼
Supabase Client (service-role for admin, anon-key for public)
    │
    ▼
External Provider (if needed)
    │
    ▼
Response → Revalidation → Render
```

---

## 2. Folder Structure

```
gh-store/
├── .github/
│   └── workflows/
│       ├── deploy.yml                  # Cloudflare Pages deployment
│       └── ci.yml                      # Lint, typecheck, test
│
├── public/
│   ├── locales/                        # i18n translation files
│   │   ├── ar/                         # Arabic (primary)
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── store.json
│   │   │   └── dashboard.json
│   │   └── en/                         # English (secondary)
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── store.json
│   │       └── dashboard.json
│   ├── images/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── [locale]/                   # Internationalized routes
│   │   │   ├── layout.tsx              # Root layout (RTL support)
│   │   │   ├── page.tsx                # Homepage
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── callback/
│   │   │   ├── store/
│   │   │   │   ├── page.tsx            # Store listing
│   │   │   │   ├── [category]/
│   │   │   │   └── [product]/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── wallet/
│   │   │   └── dashboard/              # Admin Dashboard
│   │   │       ├── layout.tsx          # Dashboard layout (sidebar)
│   │   │       ├── page.tsx            # Overview / Analytics
│   │   │       ├── website/
│   │   │       │   ├── settings/
│   │   │       │   ├── homepage/
│   │   │       │   ├── banners/
│   │   │       │   ├── navigation/
│   │   │       │   ├── footer/
│   │   │       │   ├── seo/
│   │   │       │   └── themes/
│   │   │       ├── store/
│   │   │       │   ├── products/
│   │   │       │   ├── categories/
│   │   │       │   ├── attributes/
│   │   │       │   ├── fields/
│   │   │       │   ├── pricing/
│   │   │       │   └── inventory/
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [orderId]/
│   │   │       │   ├── refunds/
│   │   │       │   └── status/
│   │   │       ├── customers/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [customerId]/
│   │   │       ├── coupons/
│   │   │       │   ├── page.tsx
│   │   │       │   └── promotions/
│   │   │       ├── analytics/
│   │   │       │   ├── sales/
│   │   │       │   ├── revenue/
│   │   │       │   ├── products/
│   │   │       │   └── providers/
│   │   │       ├── logs/
│   │   │       │   ├── audit/
│   │   │       │   └── activity/
│   │   │       └── providers/          # Provider management
│   │   │           ├── page.tsx
│   │   │           ├── [providerId]/
│   │   │           └── add/
│   │   └── api/                        # API routes (serverless functions)
│   │       ├── webhooks/
│   │       │   ├── g2bulk/
│   │       │   └── sam/
│   │       └── trpc/                   # (if needed for advanced queries)
│   │
│   ├── components/                     # Shared UI Components
│   │   ├── ui/                         # Base UI (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...                     # Auto-generated by shadcn
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx             # Dashboard sidebar
│   │   │   ├── navbar.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── store/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── category-nav.tsx
│   │   │   ├── cart-item.tsx
│   │   │   └── checkout-form.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── filters.tsx
│   │   │   └── forms/
│   │   │       ├── product-form.tsx
│   │   │       ├── category-form.tsx
│   │   │       ├── coupon-form.tsx
│   │   │       ├── provider-form.tsx
│   │   │       └── settings-form.tsx
│   │   └── shared/
│   │       ├── locale-switcher.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── loading.tsx
│   │       ├── error-boundary.tsx
│   │       ├── empty-state.tsx
│   │       └── confirm-dialog.tsx
│   │
│   ├── hooks/                          # Custom React Hooks
│   │   ├── use-auth.ts
│   │   ├── use-wallet.ts
│   │   ├── use-cart.ts
│   │   ├── use-products.ts
│   │   ├── use-orders.ts
│   │   ├── use-locale.ts
│   │   ├── use-theme.ts
│   │   └── use-debounce.ts
│   │
│   ├── lib/                            # Core Business Logic
│   │   ├── services/                   # Service Layer (server-only)
│   │   │   ├── auth.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── coupon.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── sync.service.ts
│   │   │   └── audit.service.ts
│   │   ├── providers/                  # Provider Adapters
│   │   │   ├── types.ts                # Provider interface definitions
│   │   │   ├── registry.ts             # Provider registry
│   │   │   ├── base-provider.ts        # Abstract base class
│   │   │   ├── g2bulk/
│   │   │   │   ├── index.ts            # G2Bulk adapter
│   │   │   │   ├── types.ts            # G2Bulk-specific types
│   │   │   │   └── utils.ts            # G2Bulk helpers
│   │   │   ├── sam/
│   │   │   │   ├── index.ts            # SAM adapter
│   │   │   │   ├── types.ts
│   │   │   │   └── utils.ts
│   │   │   └── templates/              # Template for new providers
│   │   │       └── provider-template.ts
│   │   ├── validation/                 # Zod Schemas
│   │   │   ├── product.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── wallet.schema.ts
│   │   │   ├── coupon.schema.ts
│   │   │   ├── provider.schema.ts
│   │   │   └── settings.schema.ts
│   │   ├── utils/
│   │   │   ├── supabase.ts             # Supabase client (server)
│   │   │   ├── supabase-client.ts      # Supabase client (browser)
│   │   │   ├── i18n.ts                 # Internationalization
│   │   │   ├── cn.ts                   # Tailwind class merging
│   │   │   ├── currency.ts             # Currency formatting
│   │   │   ├── date.ts                 # Date formatting
│   │   │   ├── rate-limiter.ts
│   │   │   └── logger.ts
│   │   └── constants.ts
│   │
│   ├── stores/                         # Zustand (if needed for client state)
│   │   ├── cart-store.ts
│   │   ├── ui-store.ts
│   │   └── auth-store.ts
│   │
│   ├── types/                          # Global TypeScript Types
│   │   ├── database.ts                 # Supabase generated types
│   │   ├── provider.ts                 # Provider types
│   │   ├── store.ts                    # Store-specific types
│   │   └── dashboard.ts               # Dashboard types
│   │
│   └── middleware.ts                   # Next.js middleware (auth, i18n, RTL)
│
├── supabase/
│   ├── migrations/                     # Database migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_auth_triggers.sql
│   │   ├── 00003_providers.sql
│   │   └── ...
│   ├── seed.sql                        # Seed data
│   └── functions/                      # Edge Functions
│       ├── sync-products/
│       │   ├── index.ts
│       │   └── test.ts
│       └── process-order/
│           ├── index.ts
│           └── test.ts
│
├── config/
│   ├── themes/
│   │   ├── default.ts
│   │   ├── dark.ts
│   │   ├── gaming.ts
│   │   ├── elegant.ts
│   │   └── minimal.ts
│   └── providers/
│       ├── g2bulk.config.ts
│       └── sam.config.ts
│
├── .env.local                          # Local environment variables
├── .env.example                        # Documentation
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                     # shadcn/ui config
└── package.json
```

---

## 3. Database Schema & Relationships

### 3.1 Entity Relationship Diagram (Text)

```
profiles
  │
  ├── wallet_balance (1:1)
  │
  ├── wallet_transactions (1:N)
  │
  ├── orders (1:N)
  │     │
  │     ├── order_items (1:N)
  │     │     │
  │     │     └── products (N:1)
  │     │
  │     └── order_status_history (1:N)
  │
  └── reviews (1:N) ──── products (N:1)

products
  │
  ├── categories (N:1)
  │
  ├── product_attributes (1:N)
  │
  ├── product_fields (1:N)
  │
  ├── product_pricing (1:N)
  │     │
  │     └── coupons_product (N:N)
  │
  └── inventory (1:1)

categories
  │
  └── self-referential (parent_id)

providers
  │
  ├── provider_credentials (1:N)
  │
  └── sync_logs (1:N)

coupons
  │
  └── coupon_usage (1:N) ──── orders (N:1)

settings
  │
  ├── website_settings (1:1)
  │
  ├── theme_settings (1:1)
  │
  └── seo_settings (1:1)

audit_logs
activity_logs
```

### 3.2 Full Schema (PostgreSQL)

```sql
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
  version         INTEGER NOT NULL DEFAULT 1,  -- Optimistic locking
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
  reference_type  TEXT,  -- 'order', 'refund', 'manual'
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
  provider_product_id TEXT,  -- ID from external provider
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
-- PRODUCT ATTRIBUTES (static metadata like region, platform)
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

-- ============================================================
-- PRODUCT DYNAMIC FIELDS (user input fields for checkout)
-- ============================================================
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
  options         JSONB DEFAULT '[]'::jsonb,  -- For select fields
  sort_order      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, field_key)
);

CREATE INDEX idx_product_fields_product ON public.product_dynamic_fields(product_id);

-- ============================================================
-- PRODUCT PRICING (quantity-based tier pricing)
-- ============================================================
CREATE TABLE public.product_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity    INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity > 0),
  max_quantity    INTEGER,  -- NULL = unlimited
  unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  wholesale_price DECIMAL(12,2),  -- NULL = no wholesale
  UNIQUE(product_id, min_quantity)
);

CREATE INDEX idx_product_pricing_product ON public.product_pricing(product_id);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE public.inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  quantity        INTEGER NOT NULL DEFAULT -1,  -- -1 = unlimited
  reserved        INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  order_number    TEXT NOT NULL UNIQUE,  -- Human-readable: GH-XXXXXX
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
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price     DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  provider_data   JSONB DEFAULT '{}'::jsonb,  -- Provider response data
  dynamic_fields  JSONB DEFAULT '{}'::jsonb,  -- User's field inputs
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'fulfilling', 'completed', 'failed', 'refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================
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
-- PROVIDERS
-- ============================================================
CREATE TABLE public.providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('product', 'payment', 'fulfillment', 'hybrid')),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  config          JSONB DEFAULT '{}'::jsonb,  -- Provider-specific config
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROVIDER CREDENTIALS (encrypted)
-- ============================================================
CREATE TABLE public.provider_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,  -- Encrypted at rest
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, key)
);

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
-- COUPONS
-- ============================================================
CREATE TABLE public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value  DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  min_purchase    DECIMAL(12,2) DEFAULT 0,
  max_discount    DECIMAL(12,2),  -- For percentage discounts
  usage_limit     INTEGER,  -- NULL = unlimited
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

-- Product-coupon relationship (if restricted to specific products)
CREATE TABLE public.coupon_products (
  coupon_id   UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, product_id)
);

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

-- Only one settings row
INSERT INTO public.website_settings (id) VALUES (gen_random_uuid());

-- ============================================================
-- THEME SETTINGS
-- ============================================================
CREATE TABLE public.theme_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_theme    TEXT NOT NULL DEFAULT 'default',
  themes_config   JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_css      TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.theme_settings (id) VALUES (gen_random_uuid());

-- ============================================================
-- SEO SETTINGS
-- ============================================================
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
-- AUDIT LOGS
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

-- ============================================================
-- ACTIVITY LOGS (system-level)
-- ============================================================
CREATE TABLE public.activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  source          TEXT NOT NULL,  -- 'sync', 'order', 'auth', 'payment', 'system'
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
  UNIQUE(profile_id, product_id),  -- One review per product per user
  UNIQUE(profile_id, order_id)     -- One review per order
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
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

  -- Create wallet
  INSERT INTO public.wallet_balances (profile_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles: users can read own; admins can read all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Products: public read; admin write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select_public ON public.products
  FOR SELECT USING (status = 'active');
CREATE POLICY products_all_admin ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders: users read own; admins read all
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY orders_select_admin ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY orders_all_admin ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories: public read; admin write
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_select_public ON public.categories
  FOR SELECT USING (true);
CREATE POLICY categories_all_admin ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Wallets: users read own; admins read all
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_select_own ON public.wallet_balances
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY wallets_select_admin ON public.wallet_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY wallets_all_admin ON public.wallet_balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Audit logs: admin only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_admin ON public.audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 4. Authentication Flow

### 4.1 Architecture

Supabase Auth is the single source of truth for authentication.

```
┌───────────────────────────────────────────────────┐
│                   Next.js App                      │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐  │
│  │  middleware.ts │───────│  supabaseClient       │  │
│  │  (Auth Check)  │       │  (Browser)            │  │
│  └──────┬───────┘        └──────────┬───────────┘  │
│         │                           │               │
│         ▼                           ▼               │
│  ┌───────────────────────────────────────────────┐  │
│  │        @supabase/ssr (Server-side)            │  │
│  │  - createServerClient                         │  │
│  │  - createBrowserClient                        │  │
│  │  - getUser() / getSession()                   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Supabase Auth   │
              │  (PostgreSQL)    │
              │  - Email/Password│
              │  - Magic Link    │
              │  - OAuth (future)│
              └─────────────────┘
```

### 4.2 Authentication Flow Steps

1. **Sign Up**
   - User submits email + password
   - Frontend validates via Zod schema
   - Calls `supabase.auth.signUp()`
   - Supabase creates user in `auth.users`
   - Trigger `handle_new_user()` creates `profiles` row + wallet
   - Session cookie set via `@supabase/ssr`
   - Redirect to email verification page (if enabled)

2. **Sign In**
   - User submits email + password
   - Frontend validates via Zod
   - Calls `supabase.auth.signInWithPassword()`
   - On success: session cookie set, redirect to intended page
   - On failure: show error

3. **Session Management**
   - `middleware.ts` wraps every request
   - Reads session cookie, refreshes if needed
   - Attaches user to request context
   - Redirects unauthenticated users to login for protected routes

4. **Logout**
   - Calls `supabase.auth.signOut()`
   - Clears session cookie
   - Redirects to homepage

### 4.3 Middleware Logic

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);

  // 1. Refresh session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. Get user (with profile)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Check route access
  const isAdminRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isProtectedRoute =
    isAdminRoute ||
    request.nextUrl.pathname.startsWith("/orders") ||
    request.nextUrl.pathname.startsWith("/wallet");

  if (isProtectedRoute && !user) {
    return redirectToLogin(request);
  }

  if (isAdminRoute && user?.role !== "admin") {
    return forbiddenResponse(request);
  }

  if (isAuthRoute && user) {
    return redirectToHome(request);
  }

  return response;
}
```

---

## 5. Authorization (RBAC)

### 5.1 Role Definitions

| Role         | Permissions                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Customer** | Read products, create orders, view own orders, manage own wallet, write reviews            |
| **Admin**    | Full CRUD on all entities, manage providers, view analytics, manage customers, access logs |

### 5.2 Implementation

**Server-side (canary)**

```typescript
// src/lib/utils/supabase.ts
export async function requireAuth() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError("Authentication required");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new ForbiddenError("Admin access required");
  return user;
}
```

**Client-side (soft UI guard)**

```typescript
// useAuth hook provides user and role
// Dashboard layout checks role, redirects if not admin
```

**RLS (data-level)**

- Row Level Security policies enforce access at the database level
- Customers can only see/modify their own data
- Admins can see/modify all data

---

## 6. API Provider Architecture

### 6.1 Provider Adapter Pattern

This is the most critical architectural component. Every external provider is a **plugin** that implements a standard interface.

```
┌──────────────────────────────────────────────────────┐
│                    Provider Registry                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │           IProvider Interface                     │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │ fetch()  │ │ order()  │ │ validate()       │  │ │
│  │  └─────────┘ └──────────┘ └──────────────────┘  │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │ sync()  │ │ webhook() │ │ healthCheck()    │  │ │
│  │  └─────────┘ └──────────┘ └──────────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  G2Bulk     │  │  SAM API   │  │  Future        │  │
│  │  Adapter    │  │  Adapter   │  │  Provider      │  │
│  └────────────┘  └────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 6.2 Provider Interface (TypeScript)

```typescript
// src/lib/providers/types.ts
export interface ProviderConfig {
  id: string;
  name: string;
  slug: string;
  type: "product" | "payment" | "fulfillment" | "hybrid";
  isActive: boolean;
  credentials: Record<string, string>;
  options: Record<string, unknown>;
}

export interface ProductData {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  imageUrl?: string;
  stock?: number;
  fields?: DynamicField[];
  metadata?: Record<string, unknown>;
}

export interface OrderRequest {
  productId: string;
  quantity: number;
  customerData: Record<string, string>;
  fields: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface OrderResult {
  success: boolean;
  externalOrderId?: string;
  status: "completed" | "pending" | "failed";
  deliveryData?: Record<string, string>;
  error?: string;
}

export interface IProvider {
  readonly name: string;
  readonly slug: string;
  readonly type: ProviderConfig["type"];

  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Product operations
  fetchProducts(): Promise<ProductData[]>;
  fetchProduct(externalId: string): Promise<ProductData | null>;

  // Order operations
  placeOrder(request: OrderRequest): Promise<OrderResult>;
  checkOrderStatus(externalOrderId: string): Promise<OrderResult>;

  // Synchronization
  sync(): Promise<SyncResult>;

  // Webhook handling
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}
```

### 6.3 Provider Registry

```typescript
// src/lib/providers/registry.ts
const providerRegistry = new Map<string, new () => IProvider>();

export function registerProvider(slug: string, providerClass: new () => IProvider) {
  providerRegistry.set(slug, providerClass);
}

export function getProvider(slug: string): IProvider {
  const ProviderClass = providerRegistry.get(slug);
  if (!ProviderClass) throw new Error(`Provider "${slug}" not registered`);
  return new ProviderClass();
}

export function getAvailableProviders(): string[] {
  return Array.from(providerRegistry.keys());
}
```

### 6.4 Adding a New Provider

1. Create `src/lib/providers/new-provider/index.ts`
2. Implement `IProvider` interface
3. Register: `registerProvider('new-provider', NewProviderAdapter)`
4. Add provider record in Supabase dashboard
5. Done — Zero changes to business logic.

---

## 7. Synchronization Strategy

### 7.1 Sync Engine Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Sync Engine                          │
│                                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │  Manual   │   │ Scheduled │   │   Webhook        │ │
│  │  Trigger  │   │  (CRON)   │   │   Handler        │ │
│  └─────┬────┘   └─────┬────┘   └───────┬──────────┘ │
│        │               │                │            │
│        └───────┬───────┴────────────────┘            │
│                ▼                                     │
│        ┌────────────────┐                            │
│        │  Sync Service   │                            │
│        └───────┬────────┘                            │
│                ▼                                     │
│        ┌────────────────┐                            │
│        │ Provider.fetch  │                            │
│        │ Products()      │                            │
│        └───────┬────────┘                            │
│                ▼                                     │
│        ┌────────────────┐                            │
│        │  Diff Engine    │                            │
│        │  Compare →      │                            │
│        │  Update/Insert  │                            │
│        │  /Deactivate    │                            │
│        └───────┬────────┘                            │
│                ▼                                     │
│        ┌────────────────┐                            │
│        │  Supabase Write │                            │
│        └────────────────┘                            │
└─────────────────────────────────────────────────────┘
```

### 7.2 Sync Rules

```
For each product from provider:
  ├── Exists in DB (by provider_product_id)?
  │   ├── YES → Update: name, price, stock, status
  │   └── NO  → Insert new product
  │
After sync:
  For all products linked to this provider NOT in API response:
    → Mark as inactive (never delete)
```

### 7.3 Implementation

```typescript
// src/lib/services/sync.service.ts
export class SyncService {
  async syncProvider(providerId: string): Promise<SyncResult> {
    const provider = await getProviderFromDb(providerId);
    const adapter = getProvider(provider.slug);

    // 1. Initialize
    await adapter.initialize(provider.config);

    // 2. Fetch remote products
    const remoteProducts = await adapter.fetchProducts();

    // 3. Get local products
    const localProducts = await this.getLocalProducts(providerId);

    // 4. Diff & apply
    const result = await this.applyDiff(providerId, remoteProducts, localProducts);

    // 5. Deactivate missing
    const deactivated = await this.deactivateMissing(providerId, remoteProducts, localProducts);

    // 6. Log
    await this.logSyncResult(providerId, { ...result, deactivated });

    return result;
  }
}
```

---

## 8. Dashboard Architecture

### 8.1 Layout Structure

```
Dashboard Layout
├── Sidebar (collapsible)
│   ├── Overview (Analytics)
│   ├── Website
│   │   ├── Settings
│   │   ├── Homepage
│   │   ├── Banners
│   │   ├── Navigation
│   │   ├── Footer
│   │   ├── SEO
│   │   └── Themes
│   ├── Store
│   │   ├── Products
│   │   ├── Categories
│   │   ├── Attributes
│   │   ├── Dynamic Fields
│   │   ├── Pricing
│   │   └── Inventory
│   ├── Orders
│   │   ├── All Orders
│   │   ├── Refunds
│   │   └── Status Management
│   ├── Customers
│   ├── Coupons
│   ├── Analytics
│   ├── Providers
│   └── Logs
│       ├── Audit Logs
│       └── Activity Logs
│
├── Header
│   ├── Breadcrumb
│   ├── Search
│   ├── Notifications
│   └── Profile Menu
│
└── Main Content Area
    └── (Renders active page)
```

### 8.2 Dashboard Features

| Section        | Features                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Overview**   | Revenue chart, order count, top products, recent orders, quick stats                              |
| **Products**   | CRUD table, search, filter, bulk actions, dynamic field editor, pricing tiers, image upload       |
| **Categories** | Tree structure, drag-drop reorder, CRUD, multi-language                                           |
| **Orders**     | Data table with filters (status, date, customer), detail view, status transitions, refund         |
| **Customers**  | Profile view, order history, wallet management, balance adjustment                                |
| **Coupons**    | Code generation, discount rules, usage stats, expiry management                                   |
| **Analytics**  | Date range picker, sales chart, revenue breakdown, provider stats                                 |
| **Providers**  | Register/configure, credential management, test connection, sync trigger, sync history            |
| **Website**    | Settings form, homepage builder, banner carousel, navigation editor, SEO per-page, theme selector |
| **Logs**       | Searchable audit trail, severity filtering, export                                                |

---

## 9. State Management

### 9.1 Strategy

| State Type                                   | Solution                                | When                   |
| -------------------------------------------- | --------------------------------------- | ---------------------- |
| **Server State** (products, orders, etc.)    | **TanStack Query** (React Query)        | All data from Supabase |
| **Client State** (UI state, modals, sidebar) | **Zustand** (minimal)                   | Local UI only          |
| **Auth State**                               | **Supabase SSR + React Context**        | Auth session           |
| **Form State**                               | **React Hook Form + Zod**               | All forms              |
| **Cart State**                               | **Zustand** (persisted to localStorage) | Shopping cart          |
| **URL State**                                | **Next.js searchParams**                | Filters, pagination    |

### 9.2 TanStack Query Configuration

```typescript
// src/lib/utils/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 10. UI Architecture

### 10.1 Design System

```
GH-Store Design System
├── Colors
│   ├── Primary  (brand color)
│   ├── Secondary
│   ├── Accent
│   ├── Neutral (grays)
│   ├── Success / Warning / Error / Info
│   └── RTL-aware directional tokens
│
├── Typography
│   ├── Arabic font (Cairo, Noto Sans Arabic, or Tajawal)
│   ├── English font (Inter, system)
│   └── Scale: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
│
├── Spacing (8px grid system)
│   └── Consistent with Tailwind defaults
│
├── Components (shadcn/ui + Base UI primitives)
│   ├── button, input, label, card
│   ├── dialog, dropdown menu, popover
│   ├── table, badge, avatar
│   ├── select, checkbox, radio, switch
│   ├── tabs, accordion, sheet, collapsible
│   ├── command palette, tooltip, toast
│   ├── chart (recharts)
│   ├── skeleton, progress
│   ├── combobox, autocomplete, number field (Base UI)
│   └── multi-select (Base UI native)
│
├── Layout
│   ├── Container (1440px max, centered)
│   ├── Grid (12-column)
│   └── Sidebar (280px, collapsible)
│
└── RTL Support
    ├── dir="rtl" on <html>
    ├── Tailwind: rtl: and ltr: modifiers
    ├── Mirror margins, paddings, borders
    └── All components tested in both directions
```

### 10.2 Theme System

5 built-in themes stored as CSS variables:

```typescript
// config/themes/default.ts
export const defaultTheme = {
  name: 'Default',
  css: {
    '--background': '255 255 255',
    '--foreground': '15 23 42',
    '--primary': '99 102 241',
    '--primary-foreground': '255 255 255',
    '--secondary': '241 245 249',
    '--accent': '139 92 246',
    '--muted': '248 250 252',
    '--border': '226 232 240',
    '--radius': '0.5rem',
  },
  // Dark mode variant
  dark: { ... },
};
```

Theme selection is stored in Supabase `theme_settings` table. Applied via CSS custom properties at the `:root` level. Zero code changes needed for new themes.

---

## 11. Deployment Architecture

### 11.1 Infrastructure

```
┌────────────────────────────────────────────────────────┐
│                   Cloudflare Pages                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Next.js Static Generation + Serverless Functions  │   │
│  │  - ISR (Incremental Static Regeneration)           │   │
│  │  - Server Actions (Edge/Durable)                   │   │
│  │  - Middleware (Edge)                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Environment Variables:                                 │
│  - NEXT_PUBLIC_SUPABASE_URL                             │
│  - NEXT_PUBLIC_SUPABASE_ANON_KEY                        │
│  - SUPABASE_SERVICE_ROLE_KEY                            │
│  - Various provider API keys (encrypted)                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                    Supabase                              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL   │  │    Auth       │  │  Realtime     │ │
│  │  Database     │  │    Service    │  │  (WebSocket)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Edge         │  │  Storage     │  │  Scheduler    │ │
│  │  Functions    │  │  (Images)    │  │  (pg_cron)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                 External Services                        │
│                                                         │
│  G2Bulk API  ←→  SAM API  ←→  Future Providers         │
└─────────────────────────────────────────────────────────┘
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

### 11.3 Database Deployments

- Migrations managed via Supabase CLI
- `supabase/migrations/` stores all migration files
- CI runs migrations on deploy

---

## 12. Security Architecture

### 12.1 Security Layers

```
Layer 1: Edge / Middleware
├── Rate limiting (Cloudflare)
├── DDoS protection (Cloudflare)
└── Bot management (Cloudflare)

Layer 2: Next.js
├── Input validation (Zod)
├── Server-side validation (always)
├── CSRF protection (SameSite cookies)
└── XSS prevention (React escaping)

Layer 3: Supabase
├── Row Level Security (RLS)
├── Service-role key (server-side only)
├── Anon key (public, restricted by RLS)
└── Prepared statements (SQL injection)

Layer 4: Application
├── RBAC (role checks)
├── Audit logging
├── Rate limiting (API routes)
├── Secure session management
└── Provider credential encryption
```

### 12.2 Security Rules

1. **Never expose service-role key to the client**
2. **Never expose provider API keys to the client**
3. **Always validate input on the server** (Zod schemas)
4. **Use RLS as a safety net** (defense in depth)
5. **Encrypt provider credentials at rest** (Supabase Vault or pgcrypto)
6. **Audit all admin actions**
7. **Rate limit auth endpoints**
8. **Use parameterized queries** (Supabase client handles this)
9. **Sanitize all user-generated content**
10. **Set secure, httpOnly, SameSite cookies**

---

## 13. Environment Variables

```env
# ============================================================
# Supabase
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ============================================================
# Authentication
# ============================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# ============================================================
# G2Bulk Provider
# ============================================================
G2BULK_API_URL=https://api.g2bulk.com/v1
G2BULK_API_KEY=your-api-key-here
G2BULK_SECRET_KEY=your-secret-key-here
G2BULK_WEBHOOK_SECRET=your-webhook-secret

# ============================================================
# SAM Provider (Payment)
# ============================================================
SAM_API_URL=https://api.sam-payment.com/v1
SAM_MERCHANT_ID=your-merchant-id
SAM_API_KEY=your-api-key
SAM_WEBHOOK_SECRET=your-webhook-secret

# ============================================================
# Application
# ============================================================
NEXT_PUBLIC_APP_NAME=GH-Store
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_MAX_CART_ITEMS=50
NEXT_PUBLIC_PAGINATION_LIMIT=20

# ============================================================
# Cloudflare
# ============================================================
CF_ACCOUNT_ID=your-account-id
CF_API_TOKEN=your-api-token
```

---

## 14. Development Roadmap

### Phase 1: Foundation (Week 1-2)

| Step    | Tasks                                                                    | Dependencies |
| ------- | ------------------------------------------------------------------------ | ------------ |
| **1.1** | Initialize Next.js 15 project, configure TypeScript, Tailwind, shadcn/ui | None         |
| **1.2** | Set up Supabase project, run initial schema migrations                   | 1.1          |
| **1.3** | Implement database schema (tables, RLS, triggers)                        | 1.2          |
| **1.4** | Set up authentication (Supabase Auth + SSR)                              | 1.1, 1.3     |
| **1.5** | Implement RBAC middleware and profile management                         | 1.4          |
| **1.6** | Set up i18n (Arabic + English)                                           | 1.1          |
| **1.7** | Set up TanStack Query, React Hook Form, Zod                              | 1.1          |

### Phase 2: Dashboard (Week 3-4)

| Step    | Tasks                                           | Dependencies |
| ------- | ----------------------------------------------- | ------------ |
| **2.1** | Dashboard layout (sidebar, header, breadcrumbs) | 1.5          |
| **2.2** | Product CRUD with dynamic fields                | 1.3          |
| **2.3** | Category management (tree, reorder)             | 2.2          |
| **2.4** | Order management (list, detail, status)         | 1.3          |
| **2.5** | Customer management                             | 1.3          |
| **2.6** | Coupon management                               | 1.3          |
| **2.7** | Website settings, SEO, navigation               | 1.3          |

### Phase 3: Provider System (Week 5)

| Step    | Tasks                                   | Dependencies |
| ------- | --------------------------------------- | ------------ |
| **3.1** | Provider adapter interface and registry | 2.2          |
| **3.2** | G2Bulk provider adapter                 | 3.1          |
| **3.3** | SAM API payment adapter                 | 3.1          |
| **3.4** | Provider management UI in dashboard     | 2.7          |
| **3.5** | Synchronization engine                  | 3.2          |

### Phase 4: Storefront (Week 6-7)

| Step    | Tasks                                          | Dependencies |
| ------- | ---------------------------------------------- | ------------ |
| **4.1** | Storefront layout (header, footer, navigation) | 1.6, 2.7     |
| **4.2** | Product browsing (grid, search, filters)       | 2.2, 2.3     |
| **4.3** | Product detail page with dynamic fields        | 4.2          |
| **4.4** | Cart system (state, persistence)               | 4.3          |
| **4.5** | Checkout flow (form, payment, wallet)          | 4.4, 3.3     |
| **4.6** | Order history for customers                    | 4.5          |
| **4.7** | Wallet (balance, transactions, top-up)         | 4.5          |

### Phase 5: Themes & Polish (Week 8)

| Step    | Tasks                             | Dependencies |
| ------- | --------------------------------- | ------------ |
| **5.1** | Theme system (5 themes, CSS vars) | 4.1          |
| **5.2** | Theme selector UI in dashboard    | 5.1          |
| **5.3** | Homepage hero banners             | 4.1          |
| **5.4** | Customer reviews                  | 4.2          |

### Phase 6: Analytics & Security (Week 9)

| Step    | Tasks                                        | Dependencies |
| ------- | -------------------------------------------- | ------------ |
| **6.1** | Analytics dashboard (sales, revenue, charts) | 2.4, 2.5     |
| **6.2** | Provider analytics                           | 3.2          |
| **6.3** | Audit log viewer                             | 1.3          |
| **6.4** | Activity log viewer                          | 1.3          |
| **6.5** | Security audit & hardening                   | All          |

### Phase 7: Deployment & Final Review (Week 10)

| Step    | Tasks                              | Dependencies |
| ------- | ---------------------------------- | ------------ |
| **7.1** | Cloudflare Pages deployment config | All          |
| **7.2** | CI/CD pipeline setup               | All          |
| **7.3** | Database migration automation      | All          |
| **7.4** | Performance optimization           | All          |
| **7.5** | Final testing & QA                 | All          |

---

> **Next Step:** Review this architecture document. Once approved, we will begin **Phase 1: Foundation** — initializing the Next.js project, setting up Supabase, and implementing the database schema.
