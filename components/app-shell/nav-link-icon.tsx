"use client";

import { LoaderCircle, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

type NavLinkIconProps = {
  icon: LucideIcon;
  /** Size of the box, e.g. "size-5"; icon and spinner both fill it. */
  className: string;
  strokeWidth: number;
};

/**
 * A nav link's icon that turns into a spinner while the link's page loads
 * (useLinkStatus, so it must sit inside the <Link>). Pending only lasts
 * when the page was not prefetched or the network is slow; the spinner
 * fades in after 100ms so quick navigations do not flash it. Both live in
 * one fixed box, so the label never moves. Hidden from screen readers,
 * which hear the new page's title instead.
 */
export function NavLinkIcon({
  icon: Icon,
  className,
  strokeWidth,
}: NavLinkIconProps) {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className={cn("relative block shrink-0", className)}>
      <Icon
        className={cn("size-full", pending && "animate-nav-pending-out")}
        strokeWidth={strokeWidth}
      />
      {pending && (
        <span className="absolute inset-0 animate-nav-pending-in">
          <LoaderCircle
            className="size-full animate-spin"
            strokeWidth={strokeWidth}
          />
        </span>
      )}
    </span>
  );
}
