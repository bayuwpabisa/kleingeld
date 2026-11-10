import { createAuthClient } from "better-auth/react";
import { demoSignInClient } from "./auth-demo-client";

// Same origin as the app, so no baseURL is needed.
export const authClient = createAuthClient({
  plugins: [demoSignInClient()],
});
