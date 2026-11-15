import {
  ArrowLeftRight,
  CalendarClock,
  LayoutDashboard,
  PiggyBank,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: "/dashboard" | "/transactions" | "/budgets" | "/bills" | "/settings";
  label: string;
  icon: LucideIcon;
};

/**
 * The app's sections, in order. The sidebar shows all of them; the bottom nav
 * shows the first four and reaches Pengaturan from the mobile header.
 */
export const navItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/bills", label: "Tagihan", icon: CalendarClock },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

/**
 * True on the section's page and on pages under it (`/transactions/new`).
 * `null` is a pathname not known yet: nothing is marked active.
 */
export function isActivePath(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
