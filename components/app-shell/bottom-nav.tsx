"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { isActivePath, navItems, type NavItem } from "./nav-items";

function BottomNavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { href, label, icon: Icon } = item;
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors",
        active ? "font-medium text-primary" : "text-fg-muted hover:text-fg",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-0 h-0.75 w-8 rounded-full bg-primary"
        />
      )}
      <Icon aria-hidden className="size-6" strokeWidth={active ? 2.25 : 1.75} />
      {label}
    </Link>
  );
}

/**
 * Phone navigation (below lg): four sections with the add button in the
 * middle (DESIGN.md, Navigasi). `data-bottom-nav` lifts the toast above it
 * (app/globals.css).
 */
export function BottomNav() {
  const pathname = usePathname();
  const renderItem = (item: NavItem) => (
    <li key={item.href}>
      <BottomNavLink item={item} pathname={pathname} />
    </li>
  );

  return (
    <nav
      aria-label="Navigasi utama"
      data-bottom-nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {navItems.slice(0, 2).map(renderItem)}
        <li className="flex items-center justify-center">
          <Link
            href="/transactions/new"
            aria-label="Tambah transaksi"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-overlay transition-colors hover:bg-primary-hover"
          >
            <Plus aria-hidden className="size-6" strokeWidth={2.25} />
          </Link>
        </li>
        {navItems.slice(2, 4).map(renderItem)}
      </ul>
    </nav>
  );
}
