# 🛍️ GH-Store

<div dir="rtl">

## سوق رقمي متكامل لبيع المنتجات الرقمية

**GH-Store** هو منصة تجارة إلكترونية متطورة لبيع التوب أب، بطاقات الهدايا، رموز التفعيل، تراخيص البرامج، حسابات VPN، اشتراكات البث، اشتراكات الذكاء الاصطناعي، حسابات الألعاب، والمنتجات الرقمية.

</div>

**GH-Store** is a production-grade digital marketplace for selling game top-ups, gift cards, redeem codes, software licenses, VPN accounts, streaming subscriptions, AI subscriptions, game accounts, and digital products.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🔄 Provider Adapter Architecture** | Add unlimited providers (G2Bulk, SAM, Telegram, VPN APIs) without changing business logic |
| **🌐 RTL-First Design** | Arabic-native interface with full English localization support |
| **📦 Dynamic Product Fields** | Admins create custom input fields (UID, server, region, email, password) without coding |
| **🤖 Automatic Synchronization** | Manual & scheduled sync from providers — updates, inserts, and deactivates products |
| **💳 Dual Payment** | Wallet balance + SAM API payment processing |
| **🏪 Admin Dashboard** | Full CRUD for products, orders, customers, coupons, providers, analytics, logs |
| **🎨 Theme System** | 5 built-in themes switchable from dashboard — zero code changes |
| **🔒 Enterprise Security** | RBAC, RLS, rate limiting, audit logs, encrypted credentials |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Cloudflare Pages                 │
│  ┌─────────────────────────────────────────┐ │
│  │          Next.js 16 (App Router)         │ │
│  │  ┌──────────┐  ┌──────────┐            │ │
│  │  │ Storefront│  │ Dashboard│            │ │
│  │  └─────┬─────┘  └────┬─────┘            │ │
│  │        └──────┬──────┘                  │ │
│  │   ┌───────────┴───────────┐              │ │
│  │   │    Service Layer       │              │ │
│  │   │  (Server Actions)      │              │ │
│  │   └───────────┬───────────┘              │ │
│  └───────────────┼───────────────────────────┘ │
│                  ▼                              │
│         ┌────────────────┐                     │
│         │    Supabase     │                     │
│         │  PostgreSQL DB  │                     │
│         │  Auth / Realtime│                     │
│         │  Edge Functions  │                     │
│         └────────────────┘                     │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
  ┌─────────────┐    ┌──────────────────┐
  │ G2Bulk API   │    │   SAM API        │
  │ (Provider)   │    │   (Payment)      │
  └─────────────┘    └──────────────────┘
```

[📖 Full Architecture Document →](ARCHITECTURE.md)

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 16.2.12 (Active LTS) |
| **UI Library** | React | 19.2.8 |
| **Language** | TypeScript | 7.0.2 |
| **Styling** | Tailwind CSS | 4.3.3 |
| **Components** | shadcn/ui + Base UI | CLI 4.x |
| **State (Server)** | TanStack Query | 5.101.4 |
| **Validation** | Zod | 4.4.3 |
| **Forms** | React Hook Form | 7.83.0 |
| **i18n** | next-intl | 4.13.3 |
| **Client State** | zustand | 5.0.14 |
| **Charts** | recharts | 3.10.1 |
| **Icons** | lucide-react | 1.27.0 |

| Backend | Technology | Version |
|---------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | 16.x managed |
| **Auth** | Supabase Auth | — |
| **Realtime** | Supabase Realtime | — |
| **Edge Functions** | Supabase (Deno 2.x) | Runtime 1.74.2 |
| **CLI** | Supabase CLI | 2.110.0 |

| Infrastructure | Platform |
|---------------|----------|
| **Hosting** | Cloudflare Pages |
| **CI/CD** | GitHub Actions |
| **Version Control** | GitHub |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.x (LTS)
- **pnpm** 9.x (recommended package manager)
- **Supabase CLI** 2.110.0
- A **Supabase** project (free tier works)
- A **Cloudflare** account (for deployment)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/gh-store.git
cd gh-store

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start Supabase locally
supabase start

# 5. Run database migrations
supabase db push

# 6. Start the development server
pnpm dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Providers
G2BULK_API_KEY=your-g2bulk-key
SAM_MERCHANT_ID=your-merchant-id
SAM_API_KEY=your-sam-api-key

# App
NEXT_PUBLIC_APP_NAME=GH-Store
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NEXT_PUBLIC_CURRENCY=USD
```

---

## 📁 Project Structure

```
gh-store/
├── src/
│   ├── app/[locale]/          # Internationalized routes
│   │   ├── store/             # Public storefront
│   │   ├── dashboard/         # Admin dashboard (10+ sections)
│   │   ├── auth/              # Login, register, callback
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   ├── orders/            # Order history
│   │   └── wallet/            # Wallet management
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui + Base UI primitives
│   │   ├── layout/            # Header, footer, sidebar
│   │   ├── store/             # Storefront components
│   │   └── dashboard/         # Dashboard components
│   ├── lib/
│   │   ├── services/          # Business logic (10 services)
│   │   ├── providers/         # Provider adapters (plugin architecture)
│   │   ├── validation/        # Zod schemas
│   │   └── utils/             # Supabase clients, i18n, helpers
│   ├── stores/                # Zustand stores (cart, UI)
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Auth + i18n + RTL middleware
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── functions/             # Edge Functions (sync, process)
│   └── seed.sql               # Seed data
└── config/
    ├── themes/                # 5 built-in themes
    └── providers/             # Provider configurations
```

---

## 🗄️ Database (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles extending Supabase Auth |
| `wallet_balances` | Customer wallet (optimistic locking) |
| `wallet_transactions` | Deposit, withdrawal, purchase, refund, adjustment |
| `categories` | Self-referential tree structure |
| `products` | Product catalog (synced from providers) |
| `product_pricing` | Quantity-based tier pricing |
| `product_dynamic_fields` | Custom input fields per product |
| `orders` | Full order lifecycle (10 statuses) |
| `order_items` | Individual items per order |
| `providers` | Provider registry (plugin system) |
| `provider_credentials` | Encrypted API keys |
| `sync_logs` | Sync operation history |
| `coupons` | Discount codes with rules |
| `audit_logs` | Admin action audit trail |
| `activity_logs` | System-level activity |

---

## 🔐 Security Architecture

```
Layer 1: Edge / Middleware  →  Rate limiting, DDoS, Bot mgmt (Cloudflare)
Layer 2: Next.js            →  Zod validation, CSRF, XSS prevention
Layer 3: Supabase           →  RLS, service-role/anon keys, prepared statements
Layer 4: Application        →  RBAC, audit logs, rate limiting, encrypted secrets
```

- **3-Layer Authorization**: Middleware → Services → RLS
- **Never expose** service-role keys or provider credentials to the client
- **Row Level Security** on every table
- **All admin actions** are audited

---

## 👥 Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse products, place orders, manage wallet, view order history, write reviews |
| **Admin** | Full CRUD on all entities, manage providers, analytics, customers, coupons, logs |

---

## 📊 Admin Dashboard Sections

| Section | Management Capabilities |
|---------|----------------------|
| **Overview** | Revenue charts, sales analytics, top products |
| **Website** | Settings, homepage, banners, navigation, SEO, themes |
| **Store** | Products, categories, attributes, dynamic fields, pricing, inventory |
| **Orders** | All orders, refunds, status management |
| **Customers** | Profiles, wallets, order history, roles |
| **Coupons** | Discount codes, promotions, usage stats |
| **Analytics** | Sales, revenue, profit, top products, top customers, provider stats |
| **Providers** | Register, configure, credentials, test, sync |
| **Logs** | Audit trail, activity logs |

---

## 🧩 Provider Adapter System

Every external provider is a **plugin** implementing the `IProvider` interface:

```typescript
interface IProvider {
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
  fetchProducts(): Promise<ProductData[]>;
  placeOrder(request: OrderRequest): Promise<OrderResult>;
  sync(): Promise<SyncResult>;
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}
```

Adding a new provider: **1 file, 1 line of registration, zero business logic changes.**

Initially implemented: **G2Bulk** (product sync) + **SAM API** (payment processing)

---

## 🛣️ Development Roadmap

| Phase | Duration | Focus |
|-------|----------|-------|
| **1 — Foundation** | Week 1-2 | Next.js 16 setup, Supabase, schema, auth, RBAC, i18n |
| **2 — Dashboard** | Week 3-4 | All admin CRUD sections |
| **3 — Providers** | Week 5 | Provider adapters, G2Bulk, SAM, sync engine |
| **4 — Storefront** | Week 6-7 | Public store, cart, checkout, wallet |
| **5 — Themes** | Week 8 | Theme system, homepage banners, reviews |
| **6 — Analytics** | Week 9 | Dashboards, audit logs, security hardening |
| **7 — Deploy** | Week 10 | Cloudflare Pages, CI/CD, final QA |

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<div dir="rtl">

## تواصل معنا

للاستفسارات أو المساعدة، يرجى مراسلتنا على البريد الإلكتروني: [support@gh-store.com](mailto:support@gh-store.com)

</div>

---

*Built with Next.js 16, Supabase, TypeScript, Tailwind CSS, and shadcn/ui.*
