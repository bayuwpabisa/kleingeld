import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { db } from "@/db";
import { DEMO_USER } from "@/db/demo/demo-user";
import { seedDemoUser } from "@/db/demo/seed-demo-user";

/**
 * POST /api/auth/sign-in/demo: resets the shared demo account to fresh data
 * and signs the visitor in as that account. There is no password; anyone may
 * use the demo, so the rate limit keeps the reset from being hammered.
 */
export const demoSignIn = () =>
  ({
    id: "demo-sign-in",
    endpoints: {
      signInDemo: createAuthEndpoint(
        "/sign-in/demo",
        { method: "POST" },
        async (ctx) => {
          await seedDemoUser(db);

          const user = await ctx.context.internalAdapter.findUserById(
            DEMO_USER.id,
          );
          const session = user
            ? await ctx.context.internalAdapter.createSession(user.id)
            : null;
          if (!user || !session) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Could not start a demo session",
            });
          }

          await setSessionCookie(ctx, { session, user });
          return ctx.json({ user: { id: user.id, name: user.name } });
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path) => path === "/sign-in/demo",
        window: 60,
        max: 5,
      },
    ],
  }) satisfies BetterAuthPlugin;
