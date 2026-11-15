import type { BetterAuthClientPlugin } from "better-auth/client";
import type { demoSignIn } from "./auth-demo-plugin";

/** Client side of the demo plugin: adds `authClient.signIn.demo()`. */
export const demoSignInClient = () =>
  ({
    id: "demo-sign-in",
    $InferServerPlugin: {} as ReturnType<typeof demoSignIn>,
    pathMethods: { "/sign-in/demo": "POST" },
    atomListeners: [
      {
        matcher: (path) => path === "/sign-in/demo",
        signal: "$sessionSignal",
      },
    ],
  }) satisfies BetterAuthClientPlugin;
