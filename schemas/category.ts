import type { TransactionType } from "./transaction";

/** A category as the API returns it, for pickers and labels. */
export type CategoryDto = {
  id: string;
  name: string;
  type: TransactionType;
  /** A lucide-react icon name (components/ui/category-icon.tsx). */
  icon: string;
};
