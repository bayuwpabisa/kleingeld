import type { TransactionType } from "./schema";

export type CategorySeed = {
  name: string;
  type: TransactionType;
  // A lucide-react icon name.
  icon: string;
};

// Copied to every new user with isDefault = true.
export const DEFAULT_CATEGORIES: readonly CategorySeed[] = [
  { name: "Makan", type: "expense", icon: "utensils" },
  { name: "Transport", type: "expense", icon: "bus" },
  { name: "Tagihan", type: "expense", icon: "receipt" },
  { name: "Hiburan", type: "expense", icon: "clapperboard" },
  { name: "Belanja", type: "expense", icon: "shopping-bag" },
  { name: "Kesehatan", type: "expense", icon: "heart-pulse" },
  { name: "Gaji", type: "income", icon: "wallet" },
  { name: "Freelance", type: "income", icon: "laptop" },
  { name: "Lainnya", type: "income", icon: "coins" },
];
