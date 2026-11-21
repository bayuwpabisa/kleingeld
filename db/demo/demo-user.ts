import type { CategorySeed } from "../default-categories";

export const DEMO_USER = {
  id: "demo",
  name: "Akun Demo",
  email: "demo@kleingeld.app",
} as const;

// A custom category, so the demo also shows one the user made.
export const DEMO_CUSTOM_CATEGORIES: readonly CategorySeed[] = [
  { name: "Kopi & jajan", type: "expense", icon: "coffee" },
];
