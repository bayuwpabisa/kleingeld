import { cn } from "@/lib/cn";
import { requireUser } from "@/lib/session";
import { initials } from "../initials";

type UserCardProps = {
  /** "sm" in the sidebar, "lg" on the settings page. */
  size?: "sm" | "lg";
};

/**
 * Who is signed in: initials, name and email, plus a "Demo" badge on the lg
 * card. It reads the session, so render it inside <Suspense>. It also checks
 * that session, which sends a stale cookie to /login.
 */
export async function UserCard({ size = "sm" }: UserCardProps) {
  const user = await requireUser();
  const large = size === "lg";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
          large ? "size-12 text-base" : "size-9 text-sm",
        )}
      >
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            large ? "text-base" : "text-sm",
          )}
        >
          {user.name}
        </p>
        <p className="truncate text-xs text-fg-muted">{user.email}</p>
      </div>
      {large && user.isDemo && (
        <span className="shrink-0 rounded-full border border-border-strong px-3 py-1 text-xs font-medium">
          Demo
        </span>
      )}
    </div>
  );
}

/** Same footprint as UserCard while the session loads. */
export function UserCardSkeleton({ size = "sm" }: UserCardProps) {
  const large = size === "lg";
  return (
    <div aria-hidden className="flex items-center gap-3">
      <span
        className={cn(
          "shrink-0 animate-pulse rounded-full bg-surface-muted",
          large ? "size-12" : "size-9",
        )}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="h-3.5 w-24 animate-pulse rounded bg-surface-muted" />
        <span className="h-3 w-32 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}
