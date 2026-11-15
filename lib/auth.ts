import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { defaultCategoriesFor } from "@/db/default-categories";
import * as schema from "@/db/schema";
import { demoSignIn } from "./auth-demo-plugin";

// Secrets come from the environment only (README › Auth). BETTER_AUTH_SECRET
// and BETTER_AUTH_URL are read by Better Auth itself.
const env = process.env;

// A provider is only offered when its keys are set: Vercel previews have no
// OAuth app (their URLs change), so there only the demo sign-in works.
const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
  ...(env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    }),
};

// Vercel previews are served from a deployment URL and a branch URL.
const vercelOrigins = [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
  .filter((host): host is string => Boolean(host))
  .map((host) => `https://${host}`);

export const auth = betterAuth({
  appName: "Kleingeld",
  database: drizzleAdapter(db, { provider: "pg", usePlural: true, schema }),
  trustedOrigins: vercelOrigins,
  socialProviders,
  session: {
    // A signed copy of the session in a cookie, so most checks skip the DB.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        // New accounts start with their own copy of the default categories.
        after: async (user) => {
          await db
            .insert(schema.categories)
            .values(defaultCategoriesFor(user.id));
        },
      },
    },
  },
  // nextCookies must stay last: it lets server code set auth cookies.
  plugins: [demoSignIn(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
