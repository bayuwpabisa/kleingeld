# Kleingeld

[![CI](https://github.com/bayuwpabisa/kleingeld/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/bayuwpabisa/kleingeld/actions/workflows/ci.yml)

A personal finance app for tracking transactions, monthly budgets per category, and recurring bills and installments. Built with Next.js as a frontend portfolio project, with the focus on code quality, accessibility and tests rather than feature count.

**Live:** [kleingeld.vercel.app](https://kleingeld.vercel.app)

> **Status: v0.2 (transactions).** On the live site, sign in with the demo account ("Coba akun demo") and add, edit, delete, search and filter transactions. The demo data resets on every demo sign-in. Dashboard, budgets and bills arrive in v0.3; Google and GitHub sign-in are built but switched on for the live site in v1.0.

## Roadmap

Dates of released versions are when they shipped; the others are targets, updated with every release.

| Release | Date | Scope | Status |
|---|---|---|---|
| v0.1 | 8 Nov 2026 | Tooling, CI, accessible UI kit, responsive app shell, dark mode, static landing page | ✅ Released |
| v0.2 | 21 Nov 2026 | Postgres schema and demo data, sign-in (demo account; Google and GitHub ready), transactions API, list, form and table with URL filters | ✅ Released |
| v0.3 | 28 Nov 2026 | Dashboard with charts, budgets per category, recurring bills and installments, performance and accessibility audit | In progress |
| v1.0 | 5 Dec 2026 | Unit and end-to-end tests for the main flows, Docker, Google and GitHub sign-in on the live site, full documentation | Planned |

What v0.2 contains:

- [x] Postgres on Neon with Drizzle ORM: schema, migrations, and a demo account with about three months of transactions
- [x] Sign-in with Better Auth: a one-click demo account, plus Google and GitHub when their keys are set; signed-out visitors are sent to `/login`
- [x] REST API for transactions and categories, validated with the same Zod schemas as the forms; every query is scoped to the signed-in user
- [x] Transactions page: a sortable, paged table on desktop and a list grouped by day with "Muat lebih banyak" on phones, with totals for the current filters
- [x] Search, period, category and type filters, order and page kept in the URL, so a filtered list can be bookmarked and shared
- [x] Add, edit and delete without waiting for the server (optimistic updates with rollback), and undo for a delete
- [x] One form (React Hook Form + Zod) in a dialog on desktop and on its own page on phones, with errors under each field and focus on the first one
- [x] 498 tests with Jest, React Testing Library and jest-axe; database tests run on PGlite (real Postgres in memory)

What v0.1 contains:

- [x] TypeScript strict (with `noUncheckedIndexedAccess`), ESLint, Prettier, Husky + lint-staged, commitlint
- [x] GitHub Actions CI on every PR (lint, typecheck, test, format, build) and Vercel preview deploys
- [x] Accessible base components: Button, Input, Select, Card, Dialog (native `<dialog>`), Toast, Segmented control
- [x] 60 component tests with Jest, React Testing Library and jest-axe
- [x] Mobile-first app shell: sidebar on desktop, bottom nav with an add button on mobile, skip link
- [x] Light, dark and system theme with no flash on reload, stored in `localStorage` so pages stay static
- [x] Statically rendered landing page

## Tech stack

**In use:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide icons, Neon Postgres + Drizzle ORM, Better Auth, Zod, React Hook Form, TanStack Query, Redux Toolkit, Jest + React Testing Library + jest-axe, PGlite (Postgres in tests), GitHub Actions, Vercel.

**Coming in later releases:** Recharts, Cypress + cypress-axe, Docker.

## Getting started

Requirements: Node.js 24 (see [.nvmrc](.nvmrc)) and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page runs without any setup; the signed-in pages need the database and auth below.

### Database

The app uses Postgres on [Neon](https://neon.com) through Drizzle ORM. To work on database code:

1. Create a Neon project and a `dev` branch for local work.
2. Add both connection strings of that branch to `.env.local` (ignored by Git):

   ```bash
   DATABASE_URL=postgresql://...-pooler...        # pooled, used by the app
   DATABASE_URL_UNPOOLED=postgresql://...         # direct, used by migrations
   ```

3. Apply the migrations and load the demo account (about six months of transactions up to today):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

`db:seed` only resets the demo account, so it is safe to run again.

### Auth

Sign-in uses [Better Auth](https://www.better-auth.com) with Google, GitHub and a demo account. Add these to `.env.local` too:

```bash
BETTER_AUTH_SECRET=...                 # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...                   # optional, see below
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...                   # optional, see below
GITHUB_CLIENT_SECRET=...
```

The demo sign-in ("Masuk dengan akun demo") needs only the database and the secret. Each one resets the demo data. Google and GitHub are offered only when their keys are set:

- **GitHub:** Settings › Developer settings › OAuth Apps › New. Homepage `http://localhost:3000`, callback `http://localhost:3000/api/auth/callback/github`.
- **Google:** in Google Cloud Console, set up the OAuth consent screen (External, scopes `openid`, `email`, `profile`; add yourself as a test user), then create an OAuth client ID of type Web application with origin `http://localhost:3000` and redirect URI `http://localhost:3000/api/auth/callback/google`.

Both the server and the login page read this list from [lib/auth-providers.ts](lib/auth-providers.ts), so `/login` shows a button only for a provider the server accepts. The login page is static and reads the keys during `next build`: after adding or removing keys, build again (on Vercel, redeploy).

`proxy.ts` sends signed-out visitors from the app pages to `/login`. It only checks that a session cookie exists; the server checks the session itself in `lib/session.ts`.

## API

REST Route Handlers under `/api`, used by the app itself. Requests and responses are checked with the Zod schemas in [schemas/](schemas/), and the forms use the same schemas. Every endpoint needs a session cookie and only sees the signed-in user's data.

| Method | Path | Body | Answer |
|---|---|---|---|
| `GET` | `/api/transactions?q=&type=&category=&from=&to=&sort=&order=&page=&pageSize=` | | `200 { data, page, pageSize, total }`; all parameters optional (see below) |
| `GET` | `/api/transactions/summary?q=&type=&category=&from=&to=` | | `200 { income: { total, count }, expense: { total, count }, balance }` for the same filters |
| `POST` | `/api/transactions` | `{ type, categoryId, amount, date, note? }` | `201` with the transaction and a `Location` header |
| `GET` | `/api/transactions/{id}` | | `200` with the transaction |
| `PATCH` | `/api/transactions/{id}` | any of the fields above | `200` with the updated transaction |
| `DELETE` | `/api/transactions/{id}` | | `204` |
| `GET` | `/api/categories` | | `200` with the user's categories (`id`, `name`, `type`, `icon`), expenses first |

- List and summary parameters: `q` searches the note and the category name (case-insensitive, up to 100 characters); `type`; `category` (a category id); `from` and `to` (`YYYY-MM-DD`, both included, `from` ≤ `to`); `sort` is `date` (default) or `amount`, `order` is `desc` (default) or `asc`; `page` from 1, `pageSize` 1–100 (default 20). Ties are broken by date, entry time and id, so pages never overlap.
- `type` is `income` or `expense`; `amount` is whole rupiah (integer, 1 to 1,000,000,000,000); `date` is `YYYY-MM-DD`; `note` is up to 200 characters (blank or `null` clears it). The category must be one of the user's own, of the same type.
- Unknown fields such as `userId` are refused: the user always comes from the session.
- Bodies must be sent as `application/json` (otherwise `415`).
- A transaction of another user answers `404`, the same as one that does not exist.

Errors share one shape. Messages are in Indonesian because the UI shows them:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Data tidak valid",
    "fieldErrors": { "amount": ["Nominal harus lebih dari 0"] },
    "formErrors": ["Field tidak dikenal: userId"]
  }
}
```

| `code` | Status |
|---|---|
| `unauthorized` | 401 |
| `not_found` | 404 |
| `invalid_json`, `validation_error` | 400 |
| `unsupported_media_type` | 415 |

Trying it locally with the demo account (the sign-in resets the demo data):

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/demo \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{}'
curl -b cookies.txt "http://localhost:3000/api/transactions?pageSize=5"
```

### Client state

Data from the API is server state and lives in TanStack Query: hooks in `features/<name>/api/` call `apiFetch` (`lib/api/client.ts`), which turns error answers into `ApiError`. Redux Toolkit holds client UI state only: the toast (`useToast()`) and which transaction dialog is open on desktop; `app/providers.tsx` creates one store and one QueryClient per mount. A failed refetch while data is on screen shows a toast; a 401 sends the user back to sign in.

Adding, editing and deleting transactions is optimistic: the list changes at once, goes back if the server refuses (with a toast and, for network errors, Coba lagi), and refetches when done. Deleting can be undone from its toast. The form (React Hook Form) validates with the same Zod schema as the API. On desktop it opens in a dialog from any page; on phones it is a page (`/transactions/new`, `/transactions/[id]/edit`).

The transactions page keeps its search, filters (period, category, type), order and page in the URL, with the same names as the API, so a filtered list can be bookmarked and shared (`/transactions?q=kopi&type=expense&sort=amount`). Changes use the browser's history API, which Next.js syncs with `useSearchParams`: no server round trip, and Back returns to the previous filters. The search waits until typing stops (300 ms), and a request whose answer is no longer wanted is cancelled through its `AbortSignal`. Desktop pages through a table; phones load more rows with "Muat lebih banyak". Optimistic changes follow each cached list's filters and order, so a new row only appears in lists it belongs to.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Jest (`npm run test:watch` for watch mode); database tests run on PGlite, so no database is needed |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run db:generate` | Create a migration in `db/migrations/` from changes in `db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Reset the demo account with fresh demo data |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Project structure

```
app/            routes and layouts; app/(app)/ holds the signed-in pages, app/api/ the API
components/     shared UI: ui/ (base components), app-shell/, theme/, brand/, landing/
features/       feature code per domain (auth, transactions, budgets, bills, dashboard)
lib/            helpers, auth config, api/ (JSON responses and the browser client), store/ (Redux),
                query-client.ts, money.ts, date.ts
schemas/        Zod schemas shared by the API and the forms
test/           test helpers (renderWithProviders)
proxy.ts        redirects signed-out visitors to /login
db/             Drizzle schema, migrations, demo seed, testing/ (PGlite for tests)
docs/           scope, plans, wireframes, design tokens, learning notes
```

## Documentation

Project documents are written in Indonesian.

- [docs/mvp-scope.md](docs/mvp-scope.md): MVP scope and product decisions
- [DESIGN.md](DESIGN.md): design system (colors, type, spacing, components, dark mode)
- [CONTRIBUTING.md](CONTRIBUTING.md): Git Flow, commit rules, PR and release process
- [docs/plans/](docs/plans/): the plan for each day's task, with progress
- [docs/wireframe/mvp-v1/](docs/wireframe/mvp-v1/): wireframes for mobile and desktop
