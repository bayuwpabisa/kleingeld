import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Every Better Auth endpoint: OAuth redirects and callbacks, sessions,
// sign-out and the demo sign-in.
export const { GET, POST } = toNextJsHandler(auth);
