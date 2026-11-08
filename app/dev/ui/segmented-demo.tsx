"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ThemePreference } from "@/lib/theme";

const themeOptions = [
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
  { value: "system", label: "Sistem" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const typeOptions = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

export function SegmentedDemo() {
  const { theme, setTheme } = useTheme();
  const [type, setType] =
    useState<(typeof typeOptions)[number]["value"]>("expense");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SegmentedControl
        legend="Mode warna (mengubah tema halaman ini)"
        name="dev-theme"
        options={themeOptions}
        value={theme}
        onChange={setTheme}
      />
      <SegmentedControl
        legend="Jenis transaksi"
        name="dev-type"
        options={typeOptions}
        value={type}
        onChange={setType}
      />
    </div>
  );
}
