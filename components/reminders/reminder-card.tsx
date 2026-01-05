// components/reminders/reminder-card.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Reminder, Priority } from "@/lib/reminder";
import {
  Clock,
  RefreshCw,
  Flag,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";
import { useReminderStore } from "@/components/reminders/reminder-store";

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  const { toggleReminderStatus, deleteReminder, areas } = useReminderStore();

  // ✅ prevents SSR/CSR mismatch for locale formatting
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { timeLabel, dateLabel, isToday } = useMemo(() => {
    const due = new Date(reminder.dueAt);

    const time = due.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    const date = due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const today =
      due.toDateString() === new Date().toDateString() ||
      Math.abs(due.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

    return { timeLabel: time, dateLabel: date, isToday: today };
  }, [reminder.dueAt]);

  const priorityColor =
    reminder.priority === "high"
      ? "text-rose-400"
      : reminder.priority === "medium"
      ? "text-amber-300"
      : "text-emerald-300";

  const statusIcon =
    reminder.status === "done" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : (
      <Circle className="h-4 w-4 text-slate-500" />
    );

  const titleClasses =
    "font-medium text-slate-50" +
    (reminder.status === "done" ? " line-through text-slate-500" : "");

  const areaLabel = reminder.areaId
    ? areas.find((a) => a.id === reminder.areaId)?.label ?? "Unknown"
    : "No area";

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 text-sm shadow-sm shadow-slate-950/60 transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-950/40">
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          onClick={() => toggleReminderStatus(reminder.id)}
          className="mt-0.5 rounded-full border border-slate-700 bg-slate-950/60 p-1 transition hover:border-sky-500 hover:bg-slate-900"
        >
          {statusIcon}
        </button>

        <div className="flex-1">
          <p className={titleClasses}>{reminder.title}</p>
          {reminder.note && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
              {reminder.note}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => deleteReminder(reminder.id)}
          className="ml-1 rounded-full border border-transparent p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:border-rose-500/60 hover:bg-rose-950/30 hover:text-rose-400"
          aria-label="Delete reminder"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1">
            <Clock className="h-3 w-3" />
            {/* ✅ render stable placeholder on SSR */}
            <span>{mounted ? timeLabel : "--:--"}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              {mounted ? (isToday ? "Today" : dateLabel) : "—"}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-300">
              {areaLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 ${priorityColor}`}>
            <Flag className="h-3 w-3" />
            <span className="capitalize">
              {PRIORITY_LABELS[reminder.priority]}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <RefreshCw className="h-3 w-3" />
            <span className="capitalize">{reminder.frequency}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
