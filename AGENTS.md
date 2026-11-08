<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: Kleingeld

Personal-finance web app (transactions, budget per category, recurring bills and installments, dashboard). Built as a portfolio project for Frontend React/Next.js roles, so code quality, tests, and clarity matter more than feature count.

Current scope: **v1.0 only**. Do not add v2/v3 things (monorepo, React Native, micro frontend, NestJS, GraphQL) unless explicitly asked.

## Stack (v1)

- Next.js App Router, TypeScript (strict), Tailwind CSS
- Server state: TanStack Query. Client/UI state: Redux Toolkit
- Forms: React Hook Form + Zod (`@hookform/resolvers`)
- Auth: Better Auth (Google, GitHub, plus a demo account)
- Database: Postgres on Neon, via Drizzle ORM
- Tests: Jest + React Testing Library (unit/component), Cypress (e2e)
- CI/CD: GitHub Actions, Docker, deploy to Vercel

## Commands

Package manager: npm.

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `next typegen && tsc --noEmit` (route types are generated first, so a fresh clone checks them too)
- CI: `.github/workflows/ci.yml` runs lint, typecheck, test, format:check and build on every PR to `develop`/`main`; Vercel builds a preview for every non-`main` branch
- `npm run format` / `npm run format:check` — Prettier (Markdown and `docs/` are ignored)
- `npm test` / `npm run test:watch` — Jest + React Testing Library + jest-axe (jsdom). Test files sit next to their code as `*.test.tsx`; `jest.setup.ts` adds the jest-dom and axe matchers and a `<dialog>` stub
- `npx cypress run` — e2e (add when Cypress is set up)
- Drizzle: `npx drizzle-kit generate` then `npx drizzle-kit migrate`

Before saying a task is done: run lint, type-check (`npm run typecheck`), and the relevant tests.

Git hooks (Husky): pre-commit runs lint-staged (ESLint `--fix --max-warnings=0` + Prettier on staged files); commit-msg runs commitlint (Conventional Commits). Do not bypass them with `--no-verify`.

## Structure

Adjust this to match the real layout as it grows.

- `app/` — routes, layouts, route handlers (`app/api/...`). `app/page.tsx` is the static landing page; signed-in pages live in the route group `app/(app)/` (English paths: `/dashboard`, `/transactions`, `/budgets`, `/bills`, `/settings`), which wraps them in the app shell
- `components/` — reusable UI components: `ui/` (base components), `app-shell/` (sidebar, bottom nav, mobile header, page header), `theme/` (`ThemeProvider`, `useTheme`, `ThemePicker`), `brand/`, `landing/`
- `features/<name>/` — feature code (transactions, budgets, bills, dashboard): components, hooks, queries. Layout, import rules and safe-indexing patterns (`noUncheckedIndexedAccess` is on) are in `features/README.md`
- `lib/` — helpers, auth config, query client
- `db/` — Drizzle schema, migrations, queries
- `schemas/` — Zod schemas shared by forms and route handlers

## Conventions

- TypeScript strict. No `any`; use `unknown` and narrow it.
- Server Components by default. Add `"use client"` only when the component needs state, effects, or browser APIs.
- All input validation uses Zod. Define a schema once and reuse it for the form and the route handler; derive types with `z.infer`.
- Client-side data fetching goes through TanStack Query. Do not call `fetch` directly inside components.
- Do not put server data in Redux. Redux is for client/UI state only.
- Money is stored as integer minor units (e.g. rupiah as integers), never floats. Format with `Intl.NumberFormat`.
- Every database access goes through Drizzle; no raw SQL unless there is a reason.
- Never read or commit `.env*` files. Secrets only come from environment variables.
- Naming: components in PascalCase, files and folders in kebab-case, hooks start with `use`.
- Accessibility is required: semantic HTML, labels on inputs, keyboard support.

## Working rules

- Keep changes small and focused; one task per commit, with a clear message.
- Write or update tests together with the feature, not after.
- If a requirement is unclear or conflicts with this file, ask before guessing.
- Do not install a new dependency without saying why it is needed.

## Skills

Project skills live in `.claude/skills/` (Next.js dev loop, React, Tailwind, TanStack Query, Zod, Drizzle, Neon, Jest, Cypress, accessibility, Lighthouse). Use the matching skill before working in that area.
