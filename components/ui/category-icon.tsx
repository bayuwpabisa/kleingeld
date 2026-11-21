import {
  Bus,
  Clapperboard,
  Coffee,
  Coins,
  HeartPulse,
  Laptop,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

// Categories store a Lucide icon name (db/schema.ts, `icon`). Only the icons
// listed here are bundled, not all of Lucide. The curated list of about 20
// grows when categories can be edited in Pengaturan.
const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  bus: Bus,
  receipt: Receipt,
  clapperboard: Clapperboard,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  wallet: Wallet,
  laptop: Laptop,
  coins: Coins,
  coffee: Coffee,
};

/** A category's icon; decorative, because the category name is always shown. */
export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = icons[name] ?? Tag;
  return (
    <Icon
      aria-hidden
      data-icon={icons[name] ? name : "tag"}
      className={cn("size-5", className)}
      strokeWidth={1.75}
    />
  );
}
