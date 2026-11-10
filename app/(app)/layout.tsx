import { Suspense } from "react";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { MobileHeader } from "@/components/app-shell/mobile-header";
import { Sidebar } from "@/components/app-shell/sidebar";
import { SkipLink } from "@/components/ui/skip-link";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  UserCard,
  UserCardSkeleton,
} from "@/features/auth/components/user-card";

/**
 * App frame, mobile first (DESIGN.md, Spacing dan layout): top bar and bottom
 * nav on phones, a 240px sidebar from lg up. The bottom padding keeps the last
 * content clear of the bottom nav.
 *
 * proxy.ts keeps signed-out visitors out. The user card checks the session
 * itself (lib/session.ts); it is the only part that waits for the request,
 * so the rest of the frame is static.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SkipLink />
      <Sidebar
        account={
          <>
            <Suspense fallback={<UserCardSkeleton />}>
              <UserCard />
            </Suspense>
            <SignOutButton appearance="nav" />
          </>
        }
      />
      <div className="flex flex-1 flex-col lg:pl-60">
        <MobileHeader />
        <main
          id="konten"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-300 flex-1 flex-col gap-6 px-5 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
