# Angular vs React — catatan refresh

Untuk developer Angular yang pindah ke React 19 dan Next.js 16. Fokus: komponen, props, state, hooks.

## Ringkasan pemetaan

| Angular | React | Catatan |
|---|---|---|
| `@Component` class + template | Function component yang mengembalikan JSX | Tidak ada class, decorator, atau NgModule |
| Template (`*ngIf`, `*ngFor`, `@if`, `@for`) | JavaScript biasa di JSX (`&&`, ternary, `.map()`) | `.map()` wajib memberi `key` unik per item |
| `@Input()` / `input()` | Props (parameter fungsi) | Read-only, jangan diubah di dalam komponen |
| `@Output()` + `EventEmitter` / `output()` | Callback props (`onAdd`, `onDelete`) | Parent mengirim fungsi, child memanggilnya |
| `<ng-content>` | `children` prop | Bisa juga props berisi JSX (slot bernama) |
| Field class / `signal()` | `useState` | Update lewat setter, data harus immutable |
| `computed()` | Hitung langsung saat render | Pakai `useMemo` hanya kalau hitungannya mahal |
| `effect()`, `ngOnInit`, `ngOnDestroy` | `useEffect` + fungsi cleanup | Untuk sinkronisasi dengan dunia luar, bukan untuk menghitung data |
| Service + DI (`providedIn`, `inject()`) | Custom hook (logika) + Context (berbagi instance) | Tidak ada DI container |
| `[(ngModel)]` (two-way binding) | Controlled input: `value` + `onChange` | Aliran data selalu satu arah |
| RxJS untuk HTTP / state async | TanStack Query (server state), Redux Toolkit (UI state) | Di Kleingeld, `fetch` tidak dipanggil langsung di komponen |
| Change detection (Zone.js / signals) | Re-render saat state atau props berubah | Seluruh fungsi komponen dijalankan ulang |

## 1. Komponen

Angular memisahkan class, template, dan metadata. Di React, komponen adalah fungsi yang menerima props dan mengembalikan JSX.

```ts
// Angular
@Component({
  selector: 'app-greeting',
  template: `<p>Halo, {{ name }}!</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

```tsx
// React
type GreetingProps = { name: string };

export function Greeting({ name }: GreetingProps) {
  return <p>Halo, {name}!</p>;
}
```

- Nama komponen harus PascalCase, karena `<greeting>` dianggap tag HTML.
- `class` ditulis `className`, `for` ditulis `htmlFor`.
- Kondisi dan perulangan memakai JavaScript biasa:

```tsx
{items.length === 0 ? (
  <p>Belum ada transaksi.</p>
) : (
  <ul>
    {items.map((item) => (
      <li key={item.id}>{item.description}</li>
    ))}
  </ul>
)}
```

`key` menggantikan `trackBy`. Pakai id yang stabil, jangan index array.

## 2. Props: input, output, dan children

```tsx
type TransactionItemProps = {
  description: string;
  amount: number;
  onDelete: () => void;       // pengganti @Output()
  children?: React.ReactNode; // pengganti <ng-content>
};

export function TransactionItem({ description, amount, onDelete, children }: TransactionItemProps) {
  return (
    <li>
      {description}: {amount}
      {children}
      <button type="button" onClick={onDelete}>Hapus</button>
    </li>
  );
}

// Parent
<TransactionItem description="Kopi" amount={25000} onDelete={() => remove(id)} />
```

Props adalah satu-satunya jalan data dari parent ke child. Kalau dua komponen sibling butuh data yang sama, state dipindah ke parent terdekat (*lifting state up*), lalu diturunkan lewat props.

## 3. State: `useState` vs field/signal

```ts
// Angular (signals)
count = signal(0);
increment() { this.count.update((c) => c + 1); }
```

```tsx
// React
const [count, setCount] = useState(0);
const increment = () => setCount((c) => c + 1);
```

Perbedaan penting:
- **Immutable.** Jangan `items.push(x)`. Buat array atau objek baru: `setItems((prev) => [...prev, x])`, `prev.filter(...)`, `{ ...obj, field: v }`. React membandingkan referensi, jadi mutasi tidak memicu render ulang.
- **Setter tidak langsung mengubah variabel.** Setelah `setCount(5)`, `count` di render saat ini masih nilai lama. Nilai baru baru terlihat di render berikutnya.
- **Pakai bentuk fungsi** (`setCount(c => c + 1)`) kalau nilai baru bergantung pada nilai lama.
- **Derived state jangan disimpan di state.** Total pemasukan cukup dihitung saat render (`items.filter(...).reduce(...)`), seperti `computed()` tapi tanpa API khusus.

Controlled input (pengganti `ngModel`):

```tsx
const [description, setDescription] = useState('');

<label htmlFor="desc">Deskripsi</label>
<input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
```

## 4. Hooks

Hooks adalah fungsi `use...` yang hanya boleh dipanggil **di level atas** function component atau custom hook. Tidak boleh di dalam `if`, loop, atau callback, karena React mengenali hook dari urutan pemanggilannya.

### `useEffect`: lifecycle dan `effect()`

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);  // ngOnInit
  return () => clearInterval(id);      // ngOnDestroy
}, []);                                // [] = hanya saat mount

useEffect(() => {
  document.title = `Saldo: ${balance}`;
}, [balance]);                         // jalan ulang saat balance berubah
```

- Dependency array wajib berisi semua nilai reaktif yang dipakai di dalam effect (ESLint `react-hooks/exhaustive-deps` membantu).
- Di development, Strict Mode menjalankan effect dua kali (mount, unmount, mount) untuk memastikan cleanup benar.
- **Jangan pakai effect untuk menghitung data dari state/props.** Hitung saat render. Effect hanya untuk sinkronisasi dengan sistem luar: localStorage, timer, event listener, DOM API.

### Hook lain yang sering dipakai

| Hook | Kegunaan | Padanan Angular |
|---|---|---|
| `useRef` | Simpan nilai mutable tanpa memicu render, atau referensi elemen DOM | `@ViewChild`, field biasa |
| `useMemo` | Cache hasil hitungan mahal | `computed()` |
| `useCallback` | Cache fungsi agar referensinya stabil | — |
| `useContext` | Ambil nilai dari Provider terdekat | `inject()` |
| `useId` | Id unik yang aman untuk SSR (`htmlFor`/`aria-*`) | — |

### Custom hook: pengganti service (bagian logika)

```tsx
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return { on, toggle } as const;
}
```

Setiap komponen yang memanggil `useToggle()` mendapat **state sendiri-sendiri**. Ini beda dengan service `providedIn: 'root'` yang singleton.

### Context: pengganti DI (bagian berbagi instance)

Untuk berbagi satu state ke banyak komponen tanpa *prop drilling*, gabungkan Context dengan custom hook:

```tsx
'use client';

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  // ...fungsi addBudget, removeBudget
  return <BudgetContext value={{ budgets, addBudget, removeBudget }}>{children}</BudgetContext>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget harus dipakai di dalam <BudgetProvider>');
  return ctx;
}
```

- Provider = tempat service "di-provide". Semua komponen di bawahnya berbagi instance yang sama.
- React 19: `<BudgetContext value={...}>` bisa dipakai langsung, tanpa `.Provider`.
- Setiap perubahan value membuat semua konsumen render ulang. Untuk state global yang sering berubah, Kleingeld memakai Redux Toolkit (UI state) dan TanStack Query (server state).

## 5. Kebiasaan Angular yang perlu ditinggalkan

1. **Mutasi data** (`this.items.push`). Di React, mutasi tidak memicu render ulang.
2. **Menyimpan semua hal di state.** Kalau bisa dihitung dari state/props lain, hitung saja.
3. **Memakai effect seperti `subscribe`** untuk menyalin data antar state. Biasanya cukup derived value atau event handler.
4. **Mencari DI container.** Logika masuk ke custom hook, instance bersama masuk ke Context.
5. **Two-way binding.** Data turun lewat props, perubahan naik lewat callback.

## 6. Konteks Next.js (detail di tugas 30 Okt)

- Komponen di `app/` adalah **Server Component** secara default. Server Component tidak boleh memakai `useState`, `useEffect`, event handler, atau browser API.
- Tambahkan `'use client'` di baris pertama file yang butuh interaktivitas. Semua yang di-import file itu ikut jadi client.
- Pola umum: page (server) mengambil data, lalu meneruskannya lewat props ke komponen client kecil yang interaktif.
- Props dari server ke client harus bisa diserialisasi (tidak boleh fungsi, kecuali Server Action).
- Browser API (`window`, `localStorage`) hanya ada di client, dan render pertama tetap terjadi di server. Untuk **membaca** data dari luar React (misalnya localStorage), pakai `useSyncExternalStore` dengan server snapshot supaya HTML server dan client sama (mencegah *hydration mismatch*). `useEffect` cocok untuk **menulis** ke sistem luar atau memasang listener, bukan untuk menyalin data luar ke state.

## 7. Pelajaran dari latihan (draf, sunting dengan kata-katamu sendiri)

1. **Mengubah satu item di array tanpa mutasi.** Di Angular aku terbiasa `item.spent += x`. Di React polanya `prev.map((b) => (b.id === id ? { ...b, spent: b.spent + x } : b))`, yaitu salin array dan objek yang berubah supaya React melihat referensi baru.
2. **Service dipecah jadi Context + custom hook.** `createContext` sebagai token, Provider sebagai `providers`, dan `useBudget()` sebagai `inject()`. Bedanya, scope-nya hanya komponen di dalam Provider. Komponen "pintar" (`BudgetBoard`) mengambil data dari context, lalu meneruskannya lewat props ke komponen "bodoh" (`BudgetMeter`) yang mudah dipakai ulang dan dites.
3. **Membaca localStorage tidak boleh lewat `useEffect` + `setState`.** Next.js me-render dulu di server tanpa `window`, dan lint React 19 menolak `setState` di dalam effect. Solusinya `useSyncExternalStore`: snapshot client dari localStorage, snapshot server `null`.

Hal kecil yang sempat salah: `switch` hanya membandingkan nilai persis, jadi untuk rentang (≥ 80%) harus memakai `if` berurutan; input angka lebih aman disimpan sebagai string lalu diubah saat submit; `<dt>`/`<dd>` wajib berada di dalam `<dl>`.

## Referensi
- react.dev/learn: Thinking in React, Managing State, You Might Not Need an Effect
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
