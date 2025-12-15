// components/reminders/cleanup-settings.tsx
"use client";

import { useState, useEffect } from "react";
import { useReminderStore } from "@/components/reminders/reminder-store";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function CleanupSettings() {
  const { settings, setSettings } = useReminderStore();

  // Figure out if current value is one of the presets or custom
  const isPreset =
    settings.autoDeleteCompletedAfterDays === null ||
    settings.autoDeleteCompletedAfterDays === 7 ||
    settings.autoDeleteCompletedAfterDays === 30;

  const initialSelectValue =
    settings.autoDeleteCompletedAfterDays == null
      ? "never"
      : isPreset
      ? String(settings.autoDeleteCompletedAfterDays)
      : "custom";

  const [selectValue, setSelectValue] = useState<string>(initialSelectValue);
  const [customDays, setCustomDays] = useState<string>(
    !isPreset && settings.autoDeleteCompletedAfterDays != null
      ? String(settings.autoDeleteCompletedAfterDays)
      : "14"
  );

  // Keep local state in sync if settings change from somewhere else
  useEffect(() => {
    const presetCheck =
      settings.autoDeleteCompletedAfterDays === null ||
      settings.autoDeleteCompletedAfterDays === 7 ||
      settings.autoDeleteCompletedAfterDays === 30;

    const nextSelectValue =
      settings.autoDeleteCompletedAfterDays == null
        ? "never"
        : presetCheck
        ? String(settings.autoDeleteCompletedAfterDays)
        : "custom";

    setSelectValue(nextSelectValue);

    if (
      !presetCheck &&
      settings.autoDeleteCompletedAfterDays != null &&
      settings.autoDeleteCompletedAfterDays > 0
    ) {
      setCustomDays(String(settings.autoDeleteCompletedAfterDays));
    }
  }, [settings.autoDeleteCompletedAfterDays]);

  function handleSelectChange(next: string) {
    setSelectValue(next);

    if (next === "never") {
      setSettings((prev) => ({
        ...prev,
        autoDeleteCompletedAfterDays: null,
      }));
      return;
    }

    if (next === "custom") {
      // Don't set yet – wait until user types a number
      return;
    }

    const num = Number(next);
    setSettings((prev) => ({
      ...prev,
      autoDeleteCompletedAfterDays: Number.isFinite(num) ? num : 7,
    }));
  }

  function handleCustomBlur() {
    const num = Number(customDays);
    if (!Number.isFinite(num) || num <= 0) {
      // reset to previous or fallback
      setCustomDays("14");
      setSettings((prev) => ({
        ...prev,
        autoDeleteCompletedAfterDays: 14,
      }));
      return;
    }

    setSettings((prev) => ({
      ...prev,
      autoDeleteCompletedAfterDays: num,
    }));
  }

  return (
    <div className="mt-5 space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <Label className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
        Auto-cleanup
      </Label>
      <p className="text-[11px] text-slate-500">
        Automatically delete reminders that are completed and older than:
      </p>

      <div className="space-y-2">
        <Select value={selectValue} onValueChange={handleSelectChange}>
          <SelectTrigger className="mt-1 h-8 rounded-lg border-slate-800 bg-slate-950 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-slate-800 bg-slate-950 text-xs">
            <SelectItem value="never">Never (keep all completed)</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="custom">Custom…</SelectItem>
          </SelectContent>
        </Select>

        {selectValue === "custom" && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              onBlur={handleCustomBlur}
              className="h-8 w-20 rounded-lg border-slate-800 bg-slate-950 text-xs"
            />
            <span>days after completion</span>
          </div>
        )}
      </div>
    </div>
  );
}
