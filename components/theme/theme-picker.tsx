"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ThemePreference } from "@/lib/theme";
import { useTheme } from "./theme-provider";

const options = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

/** Terang / Gelap / Sistem, for Pengaturan › Tampilan. */
export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl
      legend="Mode warna"
      name="theme"
      options={options}
      value={theme}
      onChange={setTheme}
      className={className}
    />
  );
}
