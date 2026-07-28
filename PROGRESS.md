# 📊 تقدم المشروع — Project Progress

> **Last Updated:** July 28, 2026  
> **Current Phase:** 4 — ✅ Complete  
> **Next Phase:** 5 — Storefront

---

## Phase 0 — ✅ Architecture (Complete)

| Task                           | Status  | Notes                                                           |
| ------------------------------ | ------- | --------------------------------------------------------------- |
| Software Architecture Document | ✅ Done | `ARCHITECTURE.md` — 15 sections, all latest versions            |
| Version Matrix (July 2026)     | ✅ Done | All package versions researched and documented                  |
| Design System Document         | ✅ Done | `DESIGN-SYSTEM.md` — full design language, components, UX rules |
| Development Roadmap            | ✅ Done | `ROADMAP.md` — 19 phases with exit criteria                     |
| Project README                 | ✅ Done | Bilingual Arabic/English                                        |

### Extra Steps

- [x] Added comprehensive version matrix table with exact July 2026 versions
- [x] Chose **Base UI** over Radix for shadcn/ui v4 (MUI-backed, more future-proof)
- [x] Created DESIGN-SYSTEM.md with premium, Apple/Steam-inspired design philosophy
- [x] Created ROADMAP.md with 19 detailed phases

---

## Phase 1 — ✅ Project Initialization (Complete)

### Core Setup

| Task                         | Status  | Notes                                             |
| ---------------------------- | ------- | ------------------------------------------------- |
| Next.js 16.2.12 (Active LTS) | ✅ Done | Installed via create-next-app                     |
| React 19.2.8                 | ✅ Done | Latest stable                                     |
| TypeScript 7.0.2             | ✅ Done | Enabled via `experimental.useTypeScriptCli`       |
| Tailwind CSS v4.3.3          | ✅ Done | CSS-first config, dark mode                       |
| shadcn/ui v4 + Base UI       | ✅ Done | Initialized with `npx shadcn@latest init -t next` |

### Dependencies Installed

| Package                  | Version | Purpose                  |
| ------------------------ | ------- | ------------------------ |
| @supabase/supabase-js    | 2.110.9 | Database client          |
| @supabase/ssr            | 0.12.3  | Server-side auth         |
| @tanstack/react-query    | 5.101.4 | Server state             |
| zod                      | 4.4.3   | Validation               |
| react-hook-form          | 7.83.0  | Form management          |
| @hookform/resolvers      | 5.5.7   | Zod resolver integration |
| next-intl                | 4.13.3  | Internationalization     |
| zustand                  | 5.0.14  | Client state             |
| recharts                 | 3.10.1  | Charts                   |
| lucide-react             | 1.27.0  | Icons                    |
| class-variance-authority | 0.7.1   | Variants                 |
| tailwind-merge           | 3.6.0   | Class merging            |
| clsx                     | 2.1.1   | Conditional classes      |

### Project Scaffold

| Task                      | Status  | Notes                                          |
| ------------------------- | ------- | ---------------------------------------------- |
| src/lib/ directory        | ✅ Done | services/, providers/, validation/, utils/     |
| src/components/ directory | ✅ Done | ui/, layout/, store/, dashboard/, shared/      |
| src/hooks/ directory      | ✅ Done | Empty — ready for custom hooks                 |
| src/stores/ directory     | ✅ Done | Cart store (Zustand + localStorage)            |
| src/types/ directory      | ✅ Done | Empty — ready for type definitions             |
| src/middleware.ts         | ✅ Done | Auth + locale + RBAC (3-layer)                 |
| Route scaffold            | ✅ Done | 50+ route directories matching ARCHITECTURE.md |

### Core Utilities

| Task                    | Status  | Notes                                       |
| ----------------------- | ------- | ------------------------------------------- |
| Supabase server client  | ✅ Done | `createSupabaseServerClient()`              |
| Supabase browser client | ✅ Done | `createSupabaseBrowserClient()`             |
| Supabase admin client   | ✅ Done | `createSupabaseAdminClient()` (server-only) |
| TanStack Query provider | ✅ Done | Pre-configured with 5min stale time         |
| Cart store (Zustand)    | ✅ Done | Persisted to localStorage                   |
| i18n utilities          | ✅ Done | Translation loader + dot-notation getter    |
| cn() helper             | ✅ Done | clsx + tailwind-merge                       |
| Constants               | ✅ Done | App name, locales, order/product types      |
| Environment variables   | ✅ Done | `.env.example` with all vars documented     |
| Locale translations     | ✅ Done | Arabic + English common.json                |

### Config Files

| File            | Status  | Notes                                  |
| --------------- | ------- | -------------------------------------- |
| next.config.ts  | ✅ Done | i18n, images, security headers, TS CLI |
| tsconfig.json   | ✅ Done | Path alias @/ → src/                   |
| .nvmrc          | ✅ Done | Node 22                                |
| .npmrc          | ✅ Done | pnpm settings                          |
| .gitignore      | ✅ Done | Node, Next.js, env, IDE                |
| components.json | ✅ Done | shadcn/ui config                       |

### Bugs Fixed During Build

- [x] CSS import path: `./globals.css` → `../globals.css` in `[locale]/layout.tsx`
- [x] Cart store: Removed direct state mutation, added selector functions
- [x] Supabase client: Changed `require()` to ESM `import`
- [x] TypeScript 7.x: Added `experimental.useTypeScriptCli: true`
- [x] DEFAULT_LOCALE: Added `as Locale` type assertion for TS strict mode

### Build Verification

| Check            | Status                          |
| ---------------- | ------------------------------- |
| `next build`     | ✅ Compiled in 1580ms           |
| TypeScript check | ✅ Finished in 400ms, no errors |
| Static pages     | ✅ Generated (3/3)              |
| Middleware       | ✅ Detected as Proxy            |

---

## Phase 2 — ✅ Design System (Complete)

### Bugs Fixed

- [x] **Toaster non-functional** — Added `<Toaster />` component to root `[locale]/layout.tsx` so toast notifications are visible
- [x] **CheckoutForm hardcoded schema** — Rewrote `buildSchema()` to dynamically generate `z.object()` from the `fields` prop using `ZodTypeAny` for mixed required/optional types
- [x] **`as never` → `as any` resolver cast** — Cleaned up the dynamic Zod schema type escape hatch for react-hook-form
- [x] **Unused `Button` imports** — Removed dead imports from `header.tsx` and `locale-switcher.tsx`

### Build Verification

| Check            | Status                          |
| ---------------- | ------------------------------- |
| `next build`     | ✅ Compiled in 1746ms           |
| TypeScript check | ✅ Finished in 519ms, no errors |
| Static pages     | ✅ Generated (3/3)              |
| Middleware       | ✅ Detected as Proxy            |

### shadcn/ui Components

---

## Phase 3 — ✅ Database (Complete)

### Supabase Setup

| Task                                               | Status  | Notes                                               |
| -------------------------------------------------- | ------- | --------------------------------------------------- |
| Supabase CLI check                                 | ✅ Done | v2.109.1 installed (upgraded to v2.110.0 available) |
| `supabase init`                                    | ✅ Done | Local config initialized                            |
| `supabase link --project-ref rbabtwjkqqzsbshzsgvz` | ✅ Done | Linked to existing Supabase project                 |
| Migration re-ordered                               | ✅ Done | Fixed FK dependency: coupons before orders          |
| Migration pushed                                   | ✅ Done | All 20+ tables, RLS, triggers, indexes applied      |
| TypeScript types generated                         | ✅ Done | `src/types/database.ts` with full `Database` type   |
| `.env.example` updated                             | ✅ Done | User's Supabase URL + anon key added                |

### Database Tables Created

| Table                    | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `profiles`               | User profiles extending Supabase Auth             |
| `wallet_balances`        | Customer wallet with optimistic locking           |
| `wallet_transactions`    | Deposit, withdrawal, purchase, refund, adjustment |
| `categories`             | Self-referential tree structure (parent_id)       |
| `providers`              | Provider registry (plugin system)                 |
| `provider_credentials`   | Encrypted API keys                                |
| `products`               | Product catalog (synced from providers)           |
| `product_attributes`     | Static metadata (region, platform)                |
| `product_dynamic_fields` | Custom input fields per product                   |
| `product_pricing`        | Quantity-based tier pricing                       |
| `inventory`              | Stock tracking (-1 = unlimited)                   |
| `coupons`                | Discount codes with rules                         |
| `coupon_products`        | Product-coupon relationship                       |
| `orders`                 | Full order lifecycle (10 statuses)                |
| `order_items`            | Individual items per order                        |
| `order_status_history`   | Order status audit trail                          |
| `coupon_usage`           | Coupon usage tracking                             |
| `sync_logs`              | Sync operation history                            |
| `website_settings`       | Site configuration                                |
| `theme_settings`         | Theme management                                  |
| `seo_settings`           | Per-page SEO metadata                             |
| `homepage_banners`       | Hero banner slides                                |
| `navigation_items`       | Navigation menu (self-referential)                |
| `audit_logs`             | Admin action audit trail                          |
| `activity_logs`          | System-level activity                             |
| `reviews`                | Customer product reviews                          |

### Database Features

- [x] Row Level Security (RLS) on all tables
- [x] Auto-profile creation on signup (`handle_new_user` trigger)
- [x] Auto-wallet creation on signup
- [x] Auto-`updated_at` triggers on all tables
- [x] Foreign key constraints with proper CASCADE/RESTRICT/SET NULL
- [x] `order_status` enum type
- [x] Optimistic locking on wallet (`version` column)
- [x] Partial index on active coupons
- [x] Composite unique constraints on reviews

### Bugs Fixed During Migration

- [x] Reordered migration: `coupons` must be created before `orders` (FK: `orders.coupon_id`)

---

## Phase 4 — ✅ Authentication (Complete)

### Auth Service Layer

| Module                                    | Status  | Notes                                                                                                                         |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/validation/auth.schema.ts`       | ✅ Done | Login, register, profile, reset-password, new-password schemas with Zod v4                                                    |
| `src/lib/services/auth.service.ts`        | ✅ Done | Server-side auth: signUp, signIn, signOut, getUser, getProfile, requireAuth, requireAdmin, updateProfile, password management |
| `src/components/shared/auth-provider.tsx` | ✅ Done | Client AuthProvider with Supabase session listener + useCurrentUser hook                                                      |
| `src/hooks/use-auth.ts`                   | ✅ Done | Auth hook with TanStack Query (user, profile, signIn, signUp, signOut, updateProfile)                                         |

### Auth Pages

| Page                                    | Status  | Notes                                                                    |
| --------------------------------------- | ------- | ------------------------------------------------------------------------ |
| Login (`/auth/login`)                   | ✅ Done | Email/password form, error display, redirect after login                 |
| Register (`/auth/register`)             | ✅ Done | Full name + email + password + confirm, email verification success state |
| Password Reset (`/auth/reset-password`) | ✅ Done | Dual-mode: email form + new password form (detected by code/token param) |
| Callback (`/auth/callback`)             | ✅ Done | Exchanges Supabase auth code for session cookie                          |

### Auth Translations

| File                          | Status  | Notes                                                                          |
| ----------------------------- | ------- | ------------------------------------------------------------------------------ |
| `public/locales/ar/auth.json` | ✅ Done | Arabic auth translations (login, register, password, profile, errors, actions) |
| `public/locales/en/auth.json` | ✅ Done | English auth translations                                                      |

### Authorization Guards

| Feature                             | Status  | Notes                                                   |
| ----------------------------------- | ------- | ------------------------------------------------------- |
| Middleware auth check               | ✅ Done | Protects /dashboard, /orders, /wallet, /checkout routes |
| Middleware admin check              | ✅ Done | Checks profile.role for /dashboard routes               |
| `AuthService.requireAuth()`         | ✅ Done | Throws if no session                                    |
| `AuthService.requireAdmin()`        | ✅ Done | Throws if not admin                                     |
| `AuthService.isAdmin()`             | ✅ Done | Returns boolean (no throw)                              |
| `useAuth().isAuthenticated/isAdmin` | ✅ Done | Client-side booleans                                    |

### Bugs Fixed During Code Review

- [x] **snake_case column names** — `fullName` → `full_name`, `avatarUrl` → `avatar_url` in auth service and hook to match DB schema
- [x] **Password reset redirect** — Changed `redirectTo` to go through `/auth/callback?next=/auth/reset-password` for proper session exchange
- [x] **Dead success alert** — Removed unreachable success message from login page (redirect happened before render)
- [x] **Unstable Supabase client** — Stabilized with `useRef` in AuthProvider + all 3 auth pages

### Phase 4.5 — User Requested Enhancements

| Task                                        | Status  | Notes                                                                                       |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| Suspense boundaries for `useSearchParams()` | ✅ Done | Login, register, reset-password pages wrap `<Suspense fallback={<LoadingPage />}>`          |
| Bilingual translations wired                | ✅ Done | All auth pages use `useTranslations("auth")` with `t()` from `auth.json`                    |
| Google OAuth sign-in button                 | ✅ Done | Login + register pages have Google button calling `signInWithOAuth({ provider: "google" })` |
| `use-translations` hook                     | ✅ Done | Static module map for Turbopack, module-level cache, async loading with cancellation        |
| `use-locale` hook                           | ✅ Done | Extracts locale from `useParams()`                                                          |
| Supabase client `useRef` stabilization      | ✅ Done | Login, register, reset-password pages                                                       |

### Build Verification

| Check            | Status                                       |
| ---------------- | -------------------------------------------- |
| `next build`     | ✅ Compiled in 2.1s                          |
| TypeScript check | ✅ Finished in 409ms, no errors              |
| Auth routes      | ✅ login, register, callback, reset-password |
| Middleware       | ✅ Detected as Proxy                         |

---

## Phase 5 — ✅ Storefront — Homepage (Partial)

### Data Layer

| Module                                | Status  | Notes                                                                                    |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `src/lib/data/mock-products.ts`       | ✅ Done | 18 mock products across 6 categories, with pricing, ratings, reviews, and dynamic fields |
| `src/lib/services/product.service.ts` | ✅ Done | Server-side product service with Supabase query + mock fallback                          |
| `src/hooks/use-products.ts`           | ✅ Done | Client TanStack Query hooks: useProducts, useFeaturedProducts, useProduct, useCategories |
| Mock categories                       | ✅ Done | 6 categories: Top-Up, Gift Cards, Software, VPN, Streaming, AI                           |

### Components

| Component               | Status  | Notes                                                                                                                        |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `HeroCarousel`          | ✅ Done | Full-width embla-carousel with autoplay (5s), RTL support, arrows, dot navigation, product overlay with price + rating + CTA |
| `ProductSection`        | ✅ Done | Section header (title + view all), optional category filter, product grid, empty state                                       |
| `CategoryNav` (updated) | ✅ Done | Supports both Link navigation mode and inline filter mode with `onCategoryChange`                                            |

### Pages

| Page           | Status  | Notes                                                                                                                                                                |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage (`/`) | ✅ Done | SSR with initial data → client hydration. Hero carousel (top 5 featured) → All Products section with category filter → Per-category sections → Why GH-Store features |

### Features

- [x] Bilingual (Arabic/English) throughout
- [x] RTL support via embla-carousel direction prop
- [x] SSR data fetching with client-side hydration
- [x] Mock data fallback when Supabase is empty
- [x] Category filtering without page navigation
- [x] Featured products carousel with autoplay
- [x] Per-category product rows below all products

### Dependencies Added

- `embla-carousel-autoplay` v8.6.0 — Autoplay plugin for Embla Carousel

### Build Verification

| Check            | Status                                       |
| ---------------- | -------------------------------------------- |
| `next build`     | ✅ Compiled in 2.4s                          |
| TypeScript check | ✅ Finished in 524ms, no errors              |
| Homepage route   | ✅ `/[locale]` — dynamic server-rendered     |
| Auth routes      | ✅ login, register, callback, reset-password |
| Middleware       | ✅ Detected as Proxy                         |

### Pages Built

| Page           | Route                    | Status  | Features                                                                                                                                                                                                   |
| -------------- | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store Listing  | `/[locale]/store`        | ✅ Done | Search (live filter), category pills, sort (price/name/rating), pagination (12/page), clear filters, empty state                                                                                           |
| Product Detail | `/[locale]/store/[slug]` | ✅ Done | Hero image + badges, name + rating stars, price + discount, description, dynamic input fields, quantity selector, add-to-cart (Zustand), 3 trust badges, reviews section (5 generated), 4 related products |
| Cart           | `/[locale]/cart`         | ✅ Done | CartItem components, quantity +/- controls, remove, totals, coupon input, empty state                                                                                                                      |
| Checkout       | `/[locale]/checkout`     | ✅ Done | Order review, payment method (Wallet/SAM API), login-required card, order summary, loading state, success confirmation                                                                                     |
| My Orders      | `/[locale]/orders`       | ✅ Done | Mock orders (5 statuses), expandable cards, status badges with icons, loading skeleton, empty state                                                                                                        |
| Wallet         | `/[locale]/wallet`       | ✅ Done | Gradient balance card, show/hide toggle, deposit/withdraw/purchase/refund/adjustment icons, 8 mock transactions, relative dates, quick stats                                                               |

### Code Quality Improvements

- [x] Extracted `toGridProduct()` mapper to shared `src/lib/data/to-grid-product.ts` — used by 3 components instead of duplicated
- [x] Fixed `null → undefined` conversion for `imageUrl` field
- [x] Fixed Base UI Select `onValueChange` `string | null` type guards
- [x] Removed dead `isFieldRequired` function

### Layout

| Component   | Status                          | Notes                                                                                        |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| Header      | ✅ Wired into layout            | Sticky with backdrop-blur, nav items, search, cart badge, locale switcher, mobile sheet menu |
| Footer      | ✅ Wired into layout            | 4-column, brand, store/support/legal link groups, copyright                                  |
| Body layout | ✅ `flex min-h-screen flex-col` | Sticky footer without content overlap                                                        |

### Pages Built

| Page           | Route                    | Status  | Features                                                                                                                                                                                          |
| -------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cart           | `/[locale]/cart`         | ✅ Done | Items list (CartItem components), quantity +/- controls, remove button, clear cart, subtotal/total, coupon code input, sticky order summary sidebar, empty state with action, proceed to checkout |
| Checkout       | `/[locale]/checkout`     | ✅ Done | Order review, login-required card, payment method radio (Wallet + SAM API), order summary sidebar with totals, place order with loading state, success confirmation state, empty cart guard       |
| Store Listing  | `/[locale]/store`        | ✅ Done | Search, category pills, sort, pagination, clear filters                                                                                                                                           |
| Product Detail | `/[locale]/store/[slug]` | ✅ Done | Images, fields, add-to-cart, reviews, related                                                                                                                                                     |

### Notes

- For real data, seed Supabase with products via `supabase/seed.sql`
- Google OAuth requires enabling in Supabase dashboard → Authentication → Providers → Google

---

### Phase 4.5 — Profile Page + Google OAuth Fix (Complete)

| Task                               | Status     | Notes                                                                                                                                                                                                                           |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth Callback Route Handler        | ✅ Fixed   | Route handler at `/[locale]/auth/callback` extracts locale from URL path, uses it for redirects. Server-side code exchange with `createServerClient`                                                                            |
| Google OAuth redirect locale       | ✅ Fixed   | Login, register, and reset-password pages now include `/${locale}` prefix in OAuth `redirectTo` URLs                                                                                                                            |
| Profile page (`/[locale]/profile`) | ✅ Created | Profile summary card (avatar, name, email, phone, role badge, member since). Two tabs: Details (edit name/phone, account info display) and Security (change password with current password verification, quick links, sign out) |
| Middleware protection              | ✅ Fixed   | `/profile` added to protected routes. `/auth/callback` always allowed. `/auth/reset-password` NOT protected (needed for forgot-password flow)                                                                                   |
| Header profile link                | ✅ Added   | Mobile menu now includes "Profile" link                                                                                                                                                                                         |
| Build verification                 | ✅ Passed  | 3.3s compile, 641ms TS, zero errors — 12 routes                                                                                                                                                                                 |

### Code Quality Fixes

- [x] Used `useEffect` instead of `useState` side effect for form field initialization
- [x] Used `useRef` for Supabase client stabilization (matching login/register pattern)
- [x] Removed `/auth/reset-password` from middleware protected routes (broke forgot-password flow)

### Notes

- Google OAuth requires enabling the Google provider in Supabase Dashboard → Authentication → Providers → Google, and setting the correct redirect URIs
- The callback route handler expects the `code` query param — Supabase automatically appends it for OAuth callbacks
- Password change re-authenticates with current password before updating (OAuth users won't have a password — this is expected)

---

## Phase 6 — ✅ Admin Dashboard (Complete)

### Layout & Navigation

| Task                                                | Status  | Notes                                                                                                                                                     |
| --------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard layout (`/[locale]/dashboard/layout.tsx`) | ✅ Done | `DashboardSidebar` on desktop (lg+), Sheet-based mobile nav trigger with hamburger menu                                                                   |
| Dashboard sidebar (`DashboardSidebar`)              | ✅ Done | Existed previously — 8 sections (Overview, Website, Store, Orders, Customers, Marketing, Analytics, System) with bilingual labels, icons, collapse toggle |
| Mobile navigation                                   | ✅ Done | Sheet trigger in top bar with hamburger icon, sidebar rendered inside Sheet for mobile                                                                    |
| Middleware protection                               | ✅ Done | Already existed — `/dashboard` routes require admin role                                                                                                  |

### Pages Built

| Page               | Route                           | Status  | Features                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard Overview | `/[locale]/dashboard`           | ✅ Done | 4 stat cards (Revenue $12.4k, Orders 342, Customers 1.2k, Profit $3.8k) with trend indicators, Revenue/Profit area chart, Sales by Category pie chart, Recent Orders table (5 orders, 4 statuses), Top Products table (5 products with progress bars), Provider Statistics table (G2Bulk 94.4%, SAM API 100%) |
| Customers          | `/[locale]/dashboard/customers` | ✅ Done | 3 summary cards (Total 14, Active 12, Total Spent $3.8k), Search by name/email, Avatar+name+email+role badge+status indicator+order count+total spent+last order, Pagination (10/page, prev/next + numbered), Empty state on no search results                                                                |

### Charts (already existed)

| Component                   | Status  | Notes                                                                                          |
| --------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `Chart` (Area/Bar/Line/Pie) | ✅ Done | `src/components/dashboard/chart.tsx` with custom tooltip, responsive container, 5 chart colors |

### Build Verification

| Check            | Status                                  |
| ---------------- | --------------------------------------- |
| `next build`     | ✅ Compiled in 3.6s                     |
| TypeScript check | ✅ Finished in 499ms, no errors         |
| Dashboard routes | ✅ `/dashboard`, `/dashboard/customers` |
| Total routes     | ✅ 14 routes                            |

---

## Phase 7 — ✅ Provider Framework (Complete)

### Provider Adapter Architecture

| Module                           | Status  | Notes                                                                                                                     |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/providers/types.ts`         | ✅ Done | Shared types: ProviderInfo, SyncedProduct, SyncResult, OrderResult, ProviderBalance, ProviderConfig                       |
| `src/providers/base-provider.ts` | ✅ Done | Abstract class: getInfo(), testConnection(), syncCatalog(), getBalance(), placeOrder(), checkOrderStatus(), cancelOrder() |
| `src/providers/registry.ts`      | ✅ Done | Registry loads providers from DB, creates instances via switch, get/set/getAll methods. Initializes on server startup     |

### G2Bulk Provider

| Module                          | Status   | Notes                                                                                                                                                                                                             |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/providers/g2bulk/types.ts` | ✅ Done  | Full G2Bulk API types: getMe, category, products, games, catalogue, purchase, order, delivery                                                                                                                     |
| `src/providers/g2bulk/index.ts` | ✅ Done  | Adapter implementing: testConnection (GET /getMe), syncCatalog (products + games), placeOrder (voucher POST /products/:id/purchase + topup POST /games/:code/order), checkOrderStatus (poll /orders/:id/delivery) |
| `.env.local` G2BULK_API_KEY     | ✅ Wired | Key set from user's dashboard                                                                                                                                                                                     |

### Mock Data Removed

| Change                                | Status        | Notes                                                                                       |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `src/lib/services/product.service.ts` | ✅ Refactored | Removed all mock fallback. Uses Supabase exclusively. Returns StoreProduct[] or empty array |
| `src/hooks/use-products.ts`           | ✅ Refactored | Removed all mock fallback. Uses createSupabaseBrowserClient. Same StoreProduct type         |
| `src/lib/data/mock-products.ts`       | ✅ Deprecated | Now a thin compatibility layer: re-exports MockProduct = StoreProduct. Empty arrays         |
| `src/lib/data/to-grid-product.ts`     | ✅ Updated    | Uses StoreProduct type instead of MockProduct                                               |

### Build Verification

| Check            | Status                          |
| ---------------- | ------------------------------- |
| `next build`     | ✅ Compiled in 5.8s             |
| TypeScript check | ✅ Finished in 612ms, no errors |
| Provider modules | ✅ 5 new files created          |
| Total routes     | ✅ 14 routes                    |

### Database Migration

| Change                                 | Status     | Notes                                                                                                         |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `00002_add_product_display_fields.sql` | ✅ Pushed  | Added `original_price` (DECIMAL), `rating` (NUMERIC 2,1), `review_count` (INTEGER) to `products` table        |
| TypeScript types regenerated           | ✅ Done    | `src/types/database.ts` now includes new columns                                                              |
| `ProductService.toStoreProduct()`      | ✅ Updated | Maps `original_price` → `originalPrice`, `rating` → `rating`, `review_count` → `reviewCount` with null safety |
| `use-products.ts toProduct()`          | ✅ Updated | Same mapping as ProductService                                                                                |
| Storefront display                     | ✅ Fixed   | Discount badges, star ratings, and review counts will now show when data exists                               |

### Known Gaps

- Provider registry is built but not wired at app startup (Phase 8 will add initial triggers)
- G2Bulk full sync logic needs to be wired (API calls → DB upsert in a separate sync service)

---

## Phase 8 — ✅ G2Bulk Product Sync & Fulfillment (Complete)

### Grouped Voucher Categories (was 1171 individual → now 166 grouped)

| Change                                                           | Status  | Notes                                                                                                                                                                |
| ---------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync route rewrites voucher categories: ONE product per category | ✅ Done | Each G2Bulk category (e.g. "Itunes USA") becomes ONE product with `metadata.amounts[]` storing individual voucher options (id, title, unit_price, face_value, stock) |
| Product type: `gift_card`                                        | ✅ Done | Voucher products use type `gift_card` for storefront display                                                                                                         |
| Categories now use shared "Vouchers" store category              | ✅ Done | All vouchers under one category (slug: `vouchers`)                                                                                                                   |

### Game Top-Ups (one product per game + catalogue in metadata)

| Change                                                      | Status  | Notes                                                                                       |
| ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| Sync route: ONE product per game (not 1 per catalogue item) | ✅ Done | E.g. "Freefire Indonesia" is one product with `metadata.catalogue[]` storing all amounts    |
| Game `image_url` stored in DB                               | ✅ Done | Uses API field `image_url` (was broken before)                                              |
| Dynamic fields stored in metadata                           | ✅ Done | `player_id` (required), `server_id` (optional), `charname` (optional) with camelCase labels |
| Product type: `topup`                                       | ✅ Done | Game products use type `topup`                                                              |
| Games under shared "Games" store category                   | ✅ Done | All games under one category (slug: `games`)                                                |

### G2Bulk API Field Fixes

| Issue                                                                      | Fix                                                        |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `G2BulkGame.image` → `G2BulkGame.image_url`                                | ✅ Fixed type to match actual API response                 |
| `G2BulkCatalogueItem.{catalogue_name,price,currency}` → `{id,name,amount}` | ✅ Fixed type to match real { catalogues: [...] } response |
| Sync route: `catalogueResult?.catalogue` → `catalogueResult?.catalogues`   | ✅ Fixed plural key                                        |
| Game image passthrough in catalog route                                    | ✅ Normalizes games to include `image_url`                 |

### Homepage Display

- Synced products (status="active") will appear in the "All Products" section of the homepage
- The carousel shows `is_featured === true` products — admin can mark products as featured via dashboard or sync can set the flag

### Homepage Data Flow Fix

| Issue                                                                                                                 | Fix                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| SSR hydration: TanStack Query returns `[]` (not `undefined`) on completion, `??` was replacing server data with empty | Changed to `data && data.length > 0 ? data : serverData` — empty arrays no longer override the server-provided initial data |
| Carousel empty (no `is_featured` products)                                                                            | Added fallback chain: featured → allProducts → initialFeatured → initialSections                                            |
| No empty state when zero products                                                                                     | Added explicit empty state with guidance to sync from dashboard                                                             |
| MockProduct/MockCategory type mismatch                                                                                | Now uses `StoreProduct`/`StoreCategory` from hooks directly (the compatibility layer was already re-exporting these)        |

### Product Detail Page — Now Handles Games & Gift Cards

| Feature                      | Status  | Description                                                                                                                                                 |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Topup products (games)       | ✅ Done | Shows game hero image, catalogue items as selectable grid, dynamic input fields (UID/server/charname), purchase sidebar with price reflecting selected item |
| GiftCard products (vouchers) | ✅ Done | Shows amounts as selectable list with radio buttons, discount badges, stock warnings                                                                        |
| Metadata extraction          | ✅ Done | `ProductService.toStoreProduct()` and hook `toProduct()` now extract `fields` and `metadata` from the DB JSONB column                                       |
| Solo products (default)      | ✅ Done | Falls back to single price + quantity selector when no options exist                                                                                        |

### Hero Carousel — Full Image Background + Thumbnail Navigation

| Feature                      | Status   | Description                                                             |
| ---------------------------- | -------- | ----------------------------------------------------------------------- |
| Full-game background         | ✅ Done  | Game image as `object-cover` with gradient overlay for text readability |
| White text with shadow       | ✅ Done  | Drop-shadow ensures text readable on any background                     |
| Bottom thumbnail strip       | ✅ Done  | Click thumbnail to jump to that game's carousel slide (desktop)         |
| Dots fallback for mobile     | ✅ Done  | Traditional dots shown on mobile instead of thumbnails                  |
| Arrow buttons (desktop only) | ✅ Done  | Glassmorphic style, show on hover                                       |
| `group` class fix            | ✅ Fixed | Missing `group` class caused arrows to stay invisible                   |

### Build Verification

| Check        | Status                         |
| ------------ | ------------------------------ |
| `next build` | ✅ Compiled in 4.1s            |
| TypeScript   | ✅ Finished 622ms, zero errors |
| Total routes | ✅ 19 routes                   |

---

## Phase 9 — ⏳ SAM Payment Provider (Pending)

**Not started.** Waiting for prior phases to complete.

---

## Phase 10+ — ⏳ Future Phases (Pending)

Phases 10–19 not yet started. See `ROADMAP.md` for full plan.

---

## ✅ Bug Fix: RLS Infinite Recursion (Fixed)

### Problem

Admin users couldn't access `/dashboard` routes. The middleware tried to read the user's role from the `profiles` table, but the RLS policy `profiles_select_admin` used a recursive subquery:

```sql
EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
```

When evaluated ON the `profiles` table itself, this caused PostgreSQL to throw:

> `infinite recursion detected in policy for relation "profiles"`

### Fix

| Change                                                        | SQL Migration                 | Status     |
| ------------------------------------------------------------- | ----------------------------- | ---------- |
| Created `public.is_admin(uid UUID)` SECURITY DEFINER function | `00003_fix_rls_recursion.sql` | ✅ Pushed  |
| Dropped recursive `profiles_select_admin` policy              | Same migration                | ✅ Applied |
| Re-created using `is_admin()` (bypasses RLS, no recursion)    | Same migration                | ✅ Applied |
| Updated all other admin policies to use `is_admin()`          | Same migration                | ✅ Applied |

### Key Insight

The `SECURITY DEFINER` function runs with the owner's privileges (bypassing RLS), so it can safely query `profiles` without triggering the recursion that the inline subquery caused.

### Build Verification

| Check           | Status                          |
| --------------- | ------------------------------- |
| `next build`    | ✅ Compiled in 4.9s             |
| TypeScript      | ✅ Finished in 749ms, no errors |
| Total routes    | ✅ 17 routes                    |
| Anon key access | ✅ No more recursion error      |

---

## ✅ Bug Fix: G2Bulk Sync & Catalog (Fixed)

### Problems Found & Fixed

**1. G2Bulk API response format mismatch**
The G2Bulk API returns objects like `{ success: true, products: [...] }` and `{ success: true, games: [...] }`, but the code was treating them as bare arrays. Fixed in:

- `catalog/route.ts` — extracts `.products` and `.games` from wrapped responses
- `sync/route.ts` — extracts from all 4 API calls (products list, single product, games list, catalogue)

**2. `category_id: ""` invalid UUID**
The sync route was inserting products with `category_id: ""` (empty string) which violates the `UUID NOT NULL` constraint and FK reference to `categories`. Fixed by:

- Auto-creating a "G2Bulk Products" category for uncategorized items
- Using real UUIDs from `getOrCreateCategory()` for all product inserts
- Auto-registering the G2Bulk provider record in the `providers` table

**3. Providers page redesign**

- G2Bulk-specific branding with Zap icon
- Auto-fetches catalog on mount
- 4 stat cards: Balance, Products, Games, Synced status
- API Key editor with show/hide toggle
- Animated connection badge (ping dot)
- 4-column product/game grid
- Proper loading/error/empty/failed states
- Stock badge shows 'unlimited' when stock < 0
