"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { isActivePath, navItems } from "./nav-items";

/**
 * Desktop navigation (lg and up), fixed on the left (DESIGN.md, Navigasi).
 * The active item is not marked by the soft background alone (1.09:1): it
 * also gets primary text, a heavier icon and a 3px bar.
 * `account` sits at the bottom: the signed-in user and "Keluar". The layout
 * passes it in, so this component stays free of auth code.
 */
export function Sidebar({ account }: { account?: ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-8 border-r border-border bg-surface px-4 py-6 lg:flex">
      <Link href="/dashboard" className="self-start rounded-lg px-2">
        <Logo />
      </Link>
      <nav aria-label="Navigasi utama">
        {/* On routes with a dynamic segment (/transactions/[id]/edit) the
            pathname is only known per request, so the links wait in Suspense;
            the fallback is the same list with nothing marked active. */}
        <Suspense fallback={<SidebarLinks pathname={null} />}>
          <CurrentSidebarLinks />
        </Suspense>
      </nav>
      {account && (
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          {account}
        </div>
      )}
    </aside>
  );
}

function CurrentSidebarLinks() {
  return <SidebarLinks pathname={usePathname()} />;
}

function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                active
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-fg-muted hover:bg-surface-muted hover:text-fg",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-y-2 left-0 w-0.75 rounded-full bg-primary"
                />
              )}
              <Icon
                aria-hidden
                className="size-5 shrink-0"
                strokeWidth={active ? 2.25 : 1.75}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
