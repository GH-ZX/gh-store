# AGENTS.md — GH-Store (agent & developer rules)

**Always-on rules for every session.** Read this before writing code.

Companion docs (open only when needed):

| Doc                 | When                                                |
| ------------------- | --------------------------------------------------- |
| `ROADMAP.md`        | Phase order, exit criteria — **do not skip phases** |
| `ARCHITECTURE.md`   | System design, folders, security layers             |
| `DESIGN-SYSTEM.md`  | UI/UX — mandatory for any visual work               |
| `PRODUCT_VISION.md` | Product goals and principles                        |
| `PROGRESS.md`       | What is already done                                |
| `CONTRIBUTING.md`   | Human workflow, PR checklist, commands              |

---

## Stack (one line)

Next.js 16 App Router · React 19 · TypeScript **5.9** · Tailwind 4 · shadcn/ui (Base UI) · Supabase · next-intl · TanStack Query · Zustand · Zod 4 · pnpm

> **TypeScript pin:** use **5.9.x**, not 7.x. `typescript-eslint` (via `eslint-config-next`) hard-fails on TypeScript 7. Keep 5.9 until typescript-eslint supports TS 7.

---

## Commands (run from repo root)

```bash
pnpm dev              # local server
pnpm build            # production build
pnpm lint             # ESLint
pnpm lint:fix         # ESLint autofix
pnpm typecheck        # tsc --noEmit
pnpm format           # Prettier write
pnpm format:check     # Prettier check only
pnpm check            # lint + typecheck + format:check (gate before done)
```

Env: copy `.env.example` → `.env.local`. Never commit secrets.

---

## Non-negotiable conventions

| Topic            | Rule                                                                                    | Where                                                            |
| ---------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Phases**       | Never skip roadmap phases. Wait for approval before starting the next phase.            | `ROADMAP.md`                                                     |
| **i18n**         | No hardcoded user-facing Arabic/English strings in components. Use locale JSON + hooks. | `public/locales/{ar,en}/*.json`, `useTranslations`, `use-locale` |
| **RTL**          | Default locale is Arabic. Every UI must work RTL and LTR.                               | `middleware.ts`, layout `dir`                                    |
| **Design**       | Only Design System + `src/components/ui/*`. No one-off visual systems.                  | `DESIGN-SYSTEM.md`                                               |
| **Data access**  | Browser never uses service-role key. Server/admin clients only on server.               | `src/lib/utils/supabase*.ts`                                     |
| **AuthZ**        | 3 layers: middleware → service (`requireAuth` / `requireAdmin`) → RLS                   | `middleware.ts`, `auth.service.ts`                               |
| **Validation**   | All inputs through Zod schemas before DB/API                                            | `src/lib/validation/*`                                           |
| **Providers**    | External APIs only via `IProvider` adapters — never call G2Bulk/SAM from UI             | `src/providers/*`                                                |
| **Secrets**      | Provider credentials encrypted server-side; never log tokens/keys                       | `provider_credentials`, edge functions                           |
| **Mock data**    | Prefer Supabase; mocks only as empty-DB fallback, clearly named                         | `src/lib/data/mock-*.ts`                                         |
| **No TODOs**     | Do not leave unfinished features or `TODO` placeholders in shipped phase work           | `ROADMAP.md` principles                                          |
| **Quality gate** | Before claiming done: `pnpm check` must pass                                            | scripts below                                                    |

---

## Where things live

| Concern                             | Path                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| App routes (locale)                 | `src/app/[locale]/**`                                           |
| API routes                          | `src/app/api/**`                                                |
| UI primitives (shadcn)              | `src/components/ui/**`                                          |
| Layout / store / dashboard / shared | `src/components/{layout,store,dashboard,shared}/**`             |
| Business services                   | `src/lib/services/**`                                           |
| Provider adapters (real)            | `src/providers/**`                                              |
| Empty scaffold (legacy)             | `src/lib/providers/**` — **do not put new code here**           |
| Validation                          | `src/lib/validation/**`                                         |
| Supabase clients                    | `src/lib/utils/supabase.ts`, `supabase-client.ts`               |
| Cart (client)                       | `src/stores/cart-store.ts`                                      |
| DB types                            | `src/types/database.ts` (generated — do not hand-edit casually) |
| Migrations                          | `supabase/migrations/**`                                        |
| Edge functions                      | `supabase/functions/**`                                         |
| Themes                              | `config/themes/**`                                              |

---

## Coding standards (enforced by lint + review)

1. **TypeScript strict** — no silent `any` in new code; prefer typed helpers. Existing `as any` should shrink over time (`@typescript-eslint/no-explicit-any` is **warn**).
2. **Named exports** for services/hooks; default export only for Next.js pages/layouts and config.
3. **Server vs client** — mark client components with `"use client"`. Prefer Server Components + server services for data.
4. **Path alias** — import app code with `@/…`, never deep relative `../../../`.
5. **Snake_case DB columns** — map to camelCase only at the UI boundary if needed; match Supabase schema in services.
6. **Errors** — never swallow errors; surface user-safe messages; log details server-side only.
7. **Files** — one primary component/service per file; keep pages thin (compose components + hooks).
8. **Accessibility** — interactive elements need labels; respect focus and keyboard (shadcn/Base UI help).
9. **Mobile-first** — primary users are on phones; test narrow viewports.
10. **Commits** — small, focused; do not commit `.env.local`, keys, or `node_modules`.

---

## Surgical search habits

- Prefer `grep` scoped to `src/lib`, `src/providers`, `src/components/<area>`, `src/app/[locale]/…`.
- Prefer `read_file` on known paths over recursive directory walks.
- New UI string → add **both** `ar` and `en` locale keys.
- New protected route → update `middleware.ts` + service guards.
- New admin page → under `src/app/[locale]/dashboard/…` + sidebar entry.
- New provider → implement `IProvider` in `src/providers/<name>/` + register in `registry.ts`.

---

## Security checklist (every feature)

- [ ] No service-role or provider secrets in client bundles
- [ ] Zod validation on all mutating inputs
- [ ] RLS still correct for new tables/columns
- [ ] Admin actions go through `requireAdmin` (and audit later)
- [ ] Webhooks verify signatures / shared secrets

---

## Definition of done

A task is done only when:

1. It matches the **current roadmap phase** scope (or an explicit bugfix).
2. `pnpm check` passes (lint + typecheck + format).
3. RTL + dark mode + mobile still look correct for touched UI.
4. `PROGRESS.md` is updated if phase work completed.
5. No new hardcoded bilingual strings or credential leaks.

---

## Do not

- Skip phases or rewrite finished modules without a bug/architecture reason.
- Call external provider HTTP APIs from React components.
- Commit secrets, large binary dumps, or generated `.next` output.
- Add new UI libraries that fight shadcn/Base UI + Tailwind 4.
- Disable lint rules broadly; scope overrides to files with a comment why.
