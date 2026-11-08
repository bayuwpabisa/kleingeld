# Kleingeld

[![CI](https://github.com/bayuwpabisa/kleingeld/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/bayuwpabisa/kleingeld/actions/workflows/ci.yml)

A personal finance app for tracking transactions, monthly budgets per category, and recurring bills and installments. Built with Next.js as a frontend portfolio project, with the focus on code quality, accessibility and tests rather than feature count.

**Live:** [kleingeld.vercel.app](https://kleingeld.vercel.app)

> **Status: v0.1 (foundation).** The live site has the landing page and the app shell (navigation, page placeholders, light/dark theme). Sign-in, the database and the real features arrive in v0.2 and v0.3.

## Roadmap

| Release | Target | Scope | Status |
|---|---|---|---|
| v0.1 | 8 Nov 2026 | Tooling, CI, accessible UI kit, responsive app shell, dark mode, static landing page | ✅ Released |
| v0.2 | 15 Nov 2026 | Postgres schema and demo data, sign-in (Google, GitHub, demo account), transactions API, list, form and table with URL filters | In progress |
| v0.3 | 22 Nov 2026 | Dashboard with charts, budgets per category, recurring bills and installments, performance and accessibility audit | Planned |
| v1.0 | 29 Nov 2026 | Unit and end-to-end tests for the main flows, Docker, production deploy, full documentation | Planned |

What v0.1 contains:

- [x] TypeScript strict (with `noUncheckedIndexedAccess`), ESLint, Prettier, Husky + lint-staged, commitlint
- [x] GitHub Actions CI on every PR (lint, typecheck, test, format, build) and Vercel preview deploys
- [x] Accessible base components: Button, Input, Select, Card, Dialog (native `<dialog>`), Toast, Segmented control
- [x] 60 component tests with Jest, React Testing Library and jest-axe
- [x] Mobile-first app shell: sidebar on desktop, bottom nav with an add button on mobile, skip link
- [x] Light, dark and system theme with no flash on reload, stored in `localStorage` so pages stay static
- [x] Statically rendered landing page

## Tech stack

**In use:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide icons, Jest + React Testing Library + jest-axe, GitHub Actions, Vercel.

**Coming in later releases:** Neon Postgres + Drizzle ORM, Better Auth, Zod, TanStack Query, Redux Toolkit, React Hook Form, Recharts, Cypress + cypress-axe, Docker.

## Getting started

Requirements: Node.js 24 (see [.nvmrc](.nvmrc)) and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are needed yet.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Jest (`npm run test:watch` for watch mode) |
| `npm run format` / `npm run format:check` | Prettier |

## Project structure

```
app/            routes and layouts; app/(app)/ holds the signed-in pages
components/     shared UI: ui/ (base components), app-shell/, theme/, brand/, landing/
features/       feature code per domain (transactions, budgets, bills, dashboard)
lib/            helpers (class names, theme storage)
docs/           scope, plans, wireframes, design tokens, learning notes
```

## Documentation

Project documents are written in Indonesian.

- [docs/mvp-scope.md](docs/mvp-scope.md): MVP scope and product decisions
- [DESIGN.md](DESIGN.md): design system (colors, type, spacing, components, dark mode)
- [CONTRIBUTING.md](CONTRIBUTING.md): Git Flow, commit rules, PR and release process
- [docs/plans/](docs/plans/): the plan for each day's task, with progress
- [docs/wireframe/mvp-v1/](docs/wireframe/mvp-v1/): wireframes for mobile and desktop
