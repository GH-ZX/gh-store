# Contributing to GH-Store

This guide is for humans and agents. For AI-oriented always-on rules, see **[AGENTS.md](./AGENTS.md)**.

## Prerequisites

- **Node.js** 22.x (see `.nvmrc`)
- **pnpm** 9+ (repo uses pnpm 11)
- Supabase CLI (for migrations / edge functions)
- Copy `.env.example` → `.env.local`

## Setup

```bash
pnpm install
pnpm dev
```

Optional local Supabase:

```bash
supabase start
supabase db push
```

## Quality gates

Run before every PR or “done” claim:

```bash
pnpm check
```

This runs:

| Step   | Command             | Purpose                                            |
| ------ | ------------------- | -------------------------------------------------- |
| Lint   | `pnpm lint`         | ESLint (Next core-web-vitals + TS + project rules) |
| Types  | `pnpm typecheck`    | `tsc --noEmit`                                     |
| Format | `pnpm format:check` | Prettier (incl. Tailwind class sorting)            |

Fix automatically when safe:

```bash
pnpm lint:fix
pnpm format
```

## Scripts reference

| Script              | Description                     |
| ------------------- | ------------------------------- |
| `pnpm dev`          | Next.js dev server              |
| `pnpm build`        | Production build                |
| `pnpm start`        | Serve production build          |
| `pnpm lint`         | ESLint                          |
| `pnpm lint:fix`     | ESLint with `--fix`             |
| `pnpm typecheck`    | TypeScript check                |
| `pnpm format`       | Prettier write                  |
| `pnpm format:check` | Prettier check                  |
| `pnpm check`        | lint + typecheck + format:check |

## Development principles

1. Follow **ROADMAP.md** phase order — do not implement future modules early.
2. Follow **DESIGN-SYSTEM.md** for all UI.
3. Follow **ARCHITECTURE.md** for data flow, auth, and providers.
4. Keep the app **deployable** after every completed phase.
5. Prefer fixing root causes over silencing lint.

## Code review checklist

- [ ] `pnpm check` green
- [ ] Bilingual strings in `public/locales/ar` **and** `en`
- [ ] No service-role / API keys in client code
- [ ] New routes protected in middleware if needed
- [ ] Zod validation on mutations
- [ ] RTL and mobile sanity for UI changes
- [ ] PROGRESS.md updated for phase milestones

## Branch & commit tips

- Small commits with clear messages
- Do not force-push shared `main` without agreement
- Never commit `.env.local` or credential files

## Questions

Product intent → `PRODUCT_VISION.md`  
Architecture → `ARCHITECTURE.md`  
Agent rules → `AGENTS.md`
