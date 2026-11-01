# Dasar Next.js App Router — catatan

Untuk Next.js 16.4 dengan `cacheComponents: true` (lihat `next.config.ts`). Sumber utama: dokumentasi yang terpasang di `node_modules/next/dist/docs/01-app/`.

> **Penting:** proyek ini memakai **Cache Components**. Istilah SSR, SSG, dan ISR masih dipakai orang, tapi di proyek ini tidak lagi diatur per halaman lewat `export const dynamic = ...` atau `revalidate = 60`. Rendering sekarang diatur **per komponen**, lewat tiga alat: konten statis, `'use cache'`, dan `<Suspense>`. Bagian 5 memetakan istilah lama ke cara baru.

## 1. Routing: folder = URL

| File / folder | Fungsi | Padanan Angular |
|---|---|---|
| `app/page.tsx` | Halaman untuk URL `/` | Komponen di `routes` |
| `app/budgets/page.tsx` | Halaman `/budgets` | `{ path: 'budgets', component: ... }` |
| `app/layout.tsx` | Layout root (wajib, berisi `<html>` dan `<body>`) | `AppComponent` + `<router-outlet>` |
| `app/(app)/layout.tsx` | Layout untuk satu grup halaman. `(app)` tidak muncul di URL | Route parent dengan `children` |
| `app/transactions/[id]/page.tsx` | Segmen dinamis `/transactions/123` | `path: 'transactions/:id'` |
| `app/api/transactions/route.ts` | Route Handler (endpoint REST) | Backend terpisah |
| `loading.tsx`, `error.tsx`, `not-found.tsx` | UI loading, error, dan 404 per segmen | Resolver + error handling manual |
| `_lib/`, `_components/` | Folder privat, tidak menjadi route | — |
| `proxy.ts` (root) | Kode yang jalan sebelum request selesai | Route guard (`canActivate`) |

Aturan penting:
- **Layout tidak di-render ulang saat navigasi**, dan state di dalamnya tetap. Cocok untuk sidebar dan bottom nav.
- Layout bersarang: `app/layout.tsx` membungkus `app/(app)/layout.tsx`, yang membungkus `page.tsx`.
- `page.tsx` dan `route.ts` **tidak boleh** berada di folder yang sama.
- **`params` dan `searchParams` adalah Promise** di Next 16, jadi harus di-`await`:

```tsx
export default async function Page(props: PageProps<"/transactions/[id]">) {
  const { id } = await props.params;
  // ...
}
```

  `PageProps` dan `LayoutProps` adalah tipe global yang dibuat otomatis saat `next dev` atau `next build`, tanpa import.
- Navigasi memakai `<Link href="/budgets">` dari `next/link` (padanan `routerLink`). Link otomatis di-*prefetch*.

## 2. Server Component vs Client Component

Semua komponen di `app/` adalah **Server Component** sampai diberi `"use client"`.

| Butuh... | Pakai |
|---|---|
| Ambil data dari database, pakai secret/API key | **Server** |
| Kurangi JavaScript yang dikirim ke browser | **Server** |
| `useState`, `useEffect`, custom hook, Context | **Client** |
| Event handler (`onClick`, `onChange`, `onSubmit`) | **Client** |
| Browser API (`window`, `localStorage`) | **Client** |
| TanStack Query, Redux, React Hook Form | **Client** |

Pola dasarnya: **server di atas, client di ujung.** Page (server) mengambil data atau menyusun layout, lalu meneruskan data lewat props ke komponen client kecil yang interaktif. `"use client"` cukup ditaruh di titik masuk, karena semua yang di-import file itu ikut menjadi client (contoh: `budget-board.tsx` di playground).

Batasan:
- Props dari server ke client harus bisa diserialisasi: string, angka, objek, atau array. Fungsi tidak bisa, kecuali Server Action.
- Server Component **boleh** me-render Client Component. Client Component tidak boleh meng-import Server Component, tapi boleh menerimanya lewat `children`.

## 3. Route Handlers (`route.ts`)

Endpoint REST di dalam `app/`, memakai Web API `Request` dan `Response`. Kleingeld memakainya untuk `/api/transactions` (jadwal 11 Nov).

```ts
// app/api/transactions/route.ts
export async function GET(request: Request) {
  // cek session, ambil data milik user, lalu:
  return Response.json({ data: [] });
}

export async function POST(request: Request) {
  const body: unknown = await request.json(); // validasi dengan Zod
  return Response.json({ ok: true }, { status: 201 });
}
```

- Method yang didukung: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. Method lain mendapat `405`.
- **Dengan Cache Components, `GET` mengikuti model yang sama dengan halaman.** `GET` yang tidak menyentuh data dinamis akan di-prerender saat build. Begitu handler membaca `request.headers`, cookie, database, atau `Math.random()`, ia jalan per request. `POST`/`PATCH`/`DELETE` tidak pernah di-cache.
- `'use cache'` **tidak boleh** ditulis langsung di badan handler. Pindahkan ke fungsi helper.
- Endpoint transaksi Kleingeld membaca session user, jadi otomatis dinamis per request. Itu memang yang kita mau.

## 4. Proxy (dulu Middleware)

Next 16 mengganti nama `middleware.ts` menjadi **`proxy.ts`**, dengan fungsi yang sama. Satu file per proyek, di root (sejajar `app/`).

```ts
// proxy.ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // cek cepat: ada cookie session? kalau tidak, redirect ke /login
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/transactions/:path*"] };
```

Proxy hanya untuk **pengecekan optimis** (misalnya redirect kalau tidak ada cookie), bukan otorisasi penuh dan bukan untuk mengambil data yang lambat. **Session tetap wajib dicek ulang di setiap Route Handler**, dekat dengan data. Ini relevan untuk tugas Better Auth (10 Nov), yang di jadwal masih menyebut "middleware".

## 5. SSR, SSG, ISR: istilah lama dan cara di proyek ini

Dengan Cache Components, satu halaman bisa berisi campuran bagian statis, ter-cache, dan dinamis. Teknik ini disebut **Partial Prerendering (PPR)** dan menjadi perilaku default.

Saat build, Next.js membuat **static shell**: HTML yang langsung dikirim dari CDN. Bagian yang belum bisa dihitung saat build diganti fallback `<Suspense>`, lalu di-*stream* saat request.

| Istilah lama | Artinya | Cara di Next 16 + Cache Components |
|---|---|---|
| **SSG** (Static Site Generation) | HTML dibuat saat build | **Default.** Komponen tanpa data dinamis otomatis di-prerender ke static shell |
| **ISR** (Incremental Static Regeneration) | Halaman statis yang diperbarui berkala atau sesuai kebutuhan | `'use cache'` + `cacheLife('hours')` (berbasis waktu), atau `cacheTag('x')` + `revalidateTag`/`updateTag` (on-demand). Untuk `[id]` yang tidak diketahui saat build: App Shell dulu, lalu di-upgrade di background |
| **SSR** (Server-Side Rendering) | HTML dibuat per request | Komponen yang membaca `cookies()`, `headers()`, `searchParams`, atau data tanpa cache, **dibungkus `<Suspense>`** lalu di-stream saat request |
| **CSR** (Client-Side Rendering) | Data diambil di browser | Client Component + TanStack Query |

### Tiga alat utama

**1. Statis.** Tidak perlu apa-apa. Komponen yang hanya berisi JSX, import, atau hitungan murni otomatis masuk static shell. Contoh: hasil `npm run build` untuk `/playground` ditandai `○ (Static)`.

**2. `'use cache'`.** Untuk data yang sama bagi semua orang dan boleh sedikit basi.

```tsx
import { cacheLife, cacheTag } from "next/cache";

async function getDefaultCategories() {
  "use cache";
  cacheLife("days");
  cacheTag("categories");
  return db.select().from(categories);
}
```

Profil `cacheLife`: `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`. Profil yang terlalu pendek (`seconds` atau `expire` di bawah 5 menit) tidak masuk static shell dan diperlakukan sebagai dinamis.

**3. `<Suspense>`.** Untuk data per request atau per user.

```tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <>
      <h1>Dashboard</h1> {/* statis, langsung tampil */}
      <Suspense fallback={<SummarySkeleton />}>
        <MonthlySummary /> {/* baca session, di-stream saat request */}
      </Suspense>
    </>
  );
}
```

Dengan Cache Components, **membaca `cookies()` di luar `<Suspense>` adalah error build.** Next.js memaksa kita memilih: cache datanya, atau bungkus dengan Suspense.

### Revalidasi setelah mutasi

| | `updateTag` | `revalidateTag` |
|---|---|---|
| Di mana | Server Action saja | Server Action dan Route Handler |
| Perilaku | Cache langsung kedaluwarsa | Stale-while-revalidate (data lama dulu, baru diperbarui) |
| Kapan | User harus langsung melihat perubahannya sendiri | Sedikit terlambat tidak masalah |

Kleingeld memakai Route Handler untuk mutasi, jadi yang tersedia adalah `revalidateTag`. Untuk data yang langsung diubah user, pembaruan di layar ditangani TanStack Query (invalidate dan optimistic update, jadwal 13 Nov).

### Hati-hati dengan data pribadi

- `'use cache'` biasa **tidak boleh** memanggil `cookies()` atau `headers()`. Baca dulu di luar, lalu kirim nilainya (misalnya `userId`) sebagai argumen. Argumen otomatis menjadi bagian dari cache key.
- `'use cache: private'` bisa membaca cookie langsung, tapi hasilnya hanya disimpan di browser.
- Jangan menaruh data sensitif di argumen cache atau `cacheTag`, karena disimpan sebagai teks biasa.
- `Date.now()`, `new Date()`, dan `Math.random()` di Server Component perlu `connection()` + `<Suspense>`, atau `'use cache'`. Ini relevan untuk "bulan ini" di dashboard.

## 6. Kapan pakai apa: alur keputusan

1. Apakah komponen butuh interaktivitas atau browser API? **Ya:** Client Component. Datanya dari props atau TanStack Query.
2. Apakah datanya sama untuk semua orang? **Ya:** biarkan statis, atau `'use cache'` + `cacheLife` kalau datanya dari database atau API.
3. Apakah datanya bergantung pada user atau request (session, `searchParams`)? **Ya:** Server Component di dalam `<Suspense>` dengan fallback skeleton.
4. Taruh bagian dinamis **sedalam mungkin** di pohon komponen. Semakin dalam, semakin banyak halaman yang ikut masuk static shell dan tampil instan.

## 7. Penerapan ke Kleingeld

| Halaman | Rendering | Alasan |
|---|---|---|
| Landing `/` | Statis (SSG) | Sama untuk semua orang. Sesuai jadwal 7 Nov "landing page SSG" |
| Login `/login` | Statis + tombol client | Tombol Google/GitHub dan "Coba Demo" butuh `onClick` |
| Layout aplikasi `(app)/layout.tsx` | Statis | Sidebar, bottom nav, dan dark mode toggle (client) tidak menunggu session. Nama user dibaca di komponen kecil dalam `<Suspense>`, bukan di level atas layout |
| Dashboard | Server Component + `<Suspense>` | Data per user. Sesuai jadwal 16 Nov "Dashboard SSR, streaming dengan Suspense" |
| Transaksi | Shell statis + Client Component (TanStack Query → `/api/transactions`) | Filter, pencarian, dan optimistic update terjadi di client. Filter disimpan di URL (`searchParams`) |
| Budget, Tagihan | Sama seperti transaksi | Banyak interaksi form |
| `/api/*` | Route Handler dinamis | Membaca session dan data per user, tidak di-cache |
| Kategori bawaan | `'use cache'` + `cacheLife('days')` | Sama untuk semua user dan jarang berubah |

Pengecekan login: `proxy.ts` untuk redirect cepat, ditambah pengecekan session ulang di setiap Route Handler dan di komponen server yang membaca data user.

## 8. Perubahan Next 16 yang perlu diingat

- `middleware.ts` → `proxy.ts`.
- `params` dan `searchParams` berupa Promise.
- Cache Components aktif: rendering per komponen (`'use cache'`, `<Suspense>`), bukan per halaman (`dynamic`, `revalidate`).
- `cookies()`/`headers()` di luar `<Suspense>` = error build.
- `GET` Route Handler bisa ikut di-prerender kalau tidak menyentuh data dinamis.
- Tutorial lama (Next 13–15) banyak memakai `export const revalidate = 60`, `fetch(..., { next: { revalidate } })`, atau `getServerSideProps`. Itu model lama dan tidak dipakai di proyek ini.

## Referensi
- `node_modules/next/dist/docs/01-app/01-getting-started/`: `03-layouts-and-pages.md`, `05-server-and-client-components.md`, `08-caching.md`, `09-revalidating.md`, `15-route-handlers.md`, `16-proxy.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`
- `node_modules/next/dist/docs/01-app/04-glossary.md` (App Shell, Static Shell, PPR)
