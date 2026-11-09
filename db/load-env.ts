import { loadEnvConfig } from "@next/env";

// Loads .env* files the same way Next.js does, for code that runs outside
// Next (drizzle-kit, the seed script). Import it before anything that reads
// process.env, because ES modules are evaluated in import order.
loadEnvConfig(process.cwd());
