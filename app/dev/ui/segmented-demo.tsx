"use client";

import { useState } from "react";
import { ThemePicker } from "@/components/theme/theme-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";

const typeOptions = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

export function SegmentedDemo() {
  const [type, setType] =
    useState<(typeof typeOptions)[number]["value"]>("expense");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* The real picker: it changes this page's theme. */}
      <ThemePicker />
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
